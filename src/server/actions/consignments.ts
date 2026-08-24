"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { canWrite, requireUser } from "@/lib/auth";
import { consignmentSchema, podSchema } from "@/lib/validations";
import { nextDocumentNumberTx } from "@/lib/sequence";
import { consignmentStatusFlow } from "@/lib/constants";
import { roundMoney } from "@/lib/utils";
import type { z } from "zod";

function freightSplit(paymentType: string, freightAmount: number) {
  const amount = roundMoney(freightAmount);
  if (paymentType === "PAID") return { freightAmount: amount, freightPaidAmount: amount, balanceDue: 0 };
  if (paymentType === "TO_PAY") return { freightAmount: amount, freightPaidAmount: 0, balanceDue: amount };
  return { freightAmount: 0, freightPaidAmount: 0, balanceDue: 0 };
}

export async function createConsignment(input: z.infer<typeof consignmentSchema>) {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "Not allowed" };
  const parsed = consignmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid consignment" };

  const trip = await prisma.trip.findUnique({ where: { id: parsed.data.tripId }, include: { route: true } });
  if (!trip || trip.cancelled || trip.status === "CANCELLED" || trip.status === "COMPLETED") {
    return { error: "Cannot add consignments to this trip" };
  }
  const money = freightSplit(parsed.data.paymentType, parsed.data.freightAmount);

  const consignment = await prisma.$transaction(async (tx) => {
    const lrNumber = await nextDocumentNumberTx(tx, "LR");
    const created = await tx.consignment.create({
      data: {
        lrNumber,
        tripId: trip.id,
        consignorId: parsed.data.consignorId,
        consigneeId: parsed.data.consigneeId,
        origin: trip.route.origin,
        destination: trip.route.destination,
        goodsDescription: parsed.data.goodsDescription,
        packageCount: parsed.data.packageCount,
        weightKg: parsed.data.weightKg ?? null,
        declaredValue: parsed.data.declaredValue ?? null,
        paymentType: parsed.data.paymentType,
        ...money,
        remarks: parsed.data.remarks,
        status: trip.status === "LOADING" ? "LOADED" : trip.status === "IN_TRANSIT" ? "IN_TRANSIT" : "BOOKED",
        createdById: user.id,
      },
    });
    await tx.consignmentItem.create({
      data: {
        consignmentId: created.id,
        description: parsed.data.goodsDescription,
        packageCount: parsed.data.packageCount,
        weightKg: parsed.data.weightKg ?? null,
        declaredValue: parsed.data.declaredValue ?? null,
      },
    });
    if (parsed.data.paymentType === "PAID" && money.freightPaidAmount > 0) {
      await tx.payment.create({
        data: {
          partyId: parsed.data.consignorId,
          consignmentId: created.id,
          amount: money.freightPaidAmount,
          mode: "CASH",
          purpose: "FREIGHT_COLLECTION",
          collectorId: user.id,
        },
      });
    }
    return created;
  });

  revalidatePath("/consignments");
  revalidatePath(`/trips/${trip.id}`);
  revalidatePath("/");
  return { consignment };
}

export async function updateConsignmentStatus(id: string, next: string) {
  const user = await requireUser();
  if (!canWrite(user.role) && user.role !== "DRIVER") return { error: "Not allowed" };
  const c = await prisma.consignment.findUnique({ where: { id } });
  if (!c) return { error: "Not found" };
  const allowed = consignmentStatusFlow[c.status] ?? [];
  if (!allowed.includes(next)) return { error: `Cannot move from ${c.status} to ${next}` };
  if (next === "DELIVERED") return { error: "Use Mark Delivered to capture POD" };
  if (next === "CANCELLED") {
    if (c.freightPaidAmount > 0) return { error: "Cannot cancel an LR after freight has been collected." };
    await prisma.consignment.update({
      where: { id },
      data: { status: "CANCELLED", cancelled: true, balanceDue: 0 },
    });
  } else {
    await prisma.consignment.update({ where: { id }, data: { status: next } });
  }
  revalidatePath(`/consignments/${id}`);
  revalidatePath(`/trips/${c.tripId}`);
  return { ok: true };
}

export async function markDelivered(
  input: z.infer<typeof podSchema> & { photoPath?: string | null; signaturePath?: string | null },
) {
  const user = await requireUser();
  const parsed = podSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid POD" };
  const c = await prisma.consignment.findUnique({ where: { id: parsed.data.consignmentId } });
  if (!c || c.cancelled) return { error: "Consignment not found" };
  if (c.status === "DELIVERED") return { error: "Already delivered" };
  if (c.status === "CANCELLED") return { error: "Cancelled LR cannot be delivered" };

  await prisma.$transaction(async (tx) => {
    await tx.pOD.upsert({
      where: { consignmentId: c.id },
      create: {
        consignmentId: c.id,
        receiverName: parsed.data.receiverName,
        receiverPhone: parsed.data.receiverPhone,
        deliveredAt: new Date(parsed.data.deliveredAt),
        remarks: parsed.data.remarks,
        photoPath: input.photoPath ?? null,
        signaturePath: input.signaturePath ?? null,
        driverId: user.id,
      },
      update: {
        receiverName: parsed.data.receiverName,
        receiverPhone: parsed.data.receiverPhone,
        deliveredAt: new Date(parsed.data.deliveredAt),
        remarks: parsed.data.remarks,
        photoPath: input.photoPath ?? undefined,
        signaturePath: input.signaturePath ?? undefined,
        driverId: user.id,
      },
    });
    await tx.consignment.update({ where: { id: c.id }, data: { status: "DELIVERED" } });
  });
  revalidatePath(`/consignments/${c.id}`);
  revalidatePath(`/trips/${c.tripId}`);
  return { ok: true };
}

export async function markReturned(id: string) {
  const user = await requireUser();
  if (!canWrite(user.role) && user.role !== "DRIVER") return { error: "Not allowed" };
  const c = await prisma.consignment.findUnique({ where: { id } });
  if (!c) return { error: "Not found" };
  if (c.status === "DELIVERED" || c.status === "CANCELLED") return { error: "Cannot return this LR" };
  await prisma.consignment.update({ where: { id }, data: { status: "RETURNED_UNDELIVERED" } });
  revalidatePath(`/consignments/${id}`);
  return { ok: true };
}
