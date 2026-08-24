"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { canWrite, requireUser } from "@/lib/auth";
import { expenseSchema, tripSchema } from "@/lib/validations";
import { nextDocumentNumberTx } from "@/lib/sequence";
import { canCompleteTrip, tripStatusFlow } from "@/lib/constants";
import { roundMoney } from "@/lib/utils";
import type { z } from "zod";

export async function createTrip(input: z.infer<typeof tripSchema>) {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "Not allowed" };
  const parsed = tripSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid trip" };

  const truck = await prisma.truck.findUnique({ where: { id: parsed.data.truckId } });
  const driver = await prisma.driver.findUnique({ where: { id: parsed.data.driverId } });
  if (!truck || truck.status === "INACTIVE" || !truck.active) return { error: "Selected truck is inactive" };
  if (!driver || !driver.active) return { error: "Selected driver is inactive" };

  const trip = await prisma.$transaction(async (tx) => {
    const tripNumber = await nextDocumentNumberTx(tx, "TRIP");
    return tx.trip.create({
      data: {
        tripNumber,
        truckId: parsed.data.truckId,
        driverId: parsed.data.driverId,
        routeId: parsed.data.routeId,
        direction: parsed.data.direction,
        tripDate: new Date(parsed.data.tripDate),
        departureAt: parsed.data.departureAt ? new Date(parsed.data.departureAt) : null,
        startOdometer: parsed.data.startOdometer ?? null,
        notes: parsed.data.notes,
        status: "PLANNED",
        createdById: user.id,
      },
    });
  });
  revalidatePath("/trips");
  revalidatePath("/");
  return { trip };
}

export async function updateTripStatus(tripId: string, next: string) {
  const user = await requireUser();
  if (!canWrite(user.role) && user.role !== "DRIVER") return { error: "Not allowed" };
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { consignments: { select: { status: true, cancelled: true } } },
  });
  if (!trip) return { error: "Trip not found" };
  const allowed = tripStatusFlow[trip.status] ?? [];
  if (!allowed.includes(next)) return { error: `Cannot move from ${trip.status} to ${next}` };

  if (next === "COMPLETED") {
    const open = trip.consignments.filter((c) => !c.cancelled);
    if (!canCompleteTrip(open.map((c) => c.status))) {
      return { error: "All consignments must be delivered or returned before completing the trip" };
    }
  }

  if (next === "CANCELLED") {
    await prisma.trip.update({ where: { id: tripId }, data: { status: "CANCELLED", cancelled: true } });
  } else {
    const extra: { arrivalAt?: Date; departureAt?: Date } = {};
    if (next === "IN_TRANSIT" && !trip.departureAt) extra.departureAt = new Date();
    if (next === "ARRIVED" && !trip.arrivalAt) extra.arrivalAt = new Date();
    await prisma.trip.update({ where: { id: tripId }, data: { status: next, ...extra } });
    if (next === "LOADING") {
      await prisma.consignment.updateMany({
        where: { tripId, status: "BOOKED", cancelled: false },
        data: { status: "LOADED" },
      });
      await prisma.truck.update({ where: { id: trip.truckId }, data: { status: "ON_ROAD" } });
    }
    if (next === "IN_TRANSIT") {
      await prisma.consignment.updateMany({
        where: { tripId, status: { in: ["BOOKED", "LOADED"] }, cancelled: false },
        data: { status: "IN_TRANSIT" },
      });
      await prisma.truck.update({ where: { id: trip.truckId }, data: { status: "ON_ROAD" } });
    }
    if (next === "COMPLETED" || next === "ARRIVED") {
      const otherOpen = await prisma.trip.count({
        where: {
          truckId: trip.truckId,
          id: { not: tripId },
          status: { in: ["PLANNED", "LOADING", "IN_TRANSIT"] },
        },
      });
      if (otherOpen === 0) {
        await prisma.truck.update({
          where: { id: trip.truckId },
          data: { status: next === "COMPLETED" ? "IDLE" : "IDLE" },
        });
      }
    }
  }
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/trips");
  revalidatePath("/");
  return { ok: true };
}

export async function addExpense(input: z.infer<typeof expenseSchema>) {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "Not allowed" };
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid expense" };
  await prisma.expense.create({
    data: {
      tripId: parsed.data.tripId,
      type: parsed.data.type,
      amount: roundMoney(parsed.data.amount),
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      notes: parsed.data.notes,
    },
  });
  revalidatePath(`/trips/${parsed.data.tripId}`);
  return { ok: true };
}
