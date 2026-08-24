"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { canWrite, requireUser } from "@/lib/auth";
import { paymentSchema } from "@/lib/validations";
import { roundMoney } from "@/lib/utils";
import type { z } from "zod";

export async function recordPayment(input: z.infer<typeof paymentSchema>) {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "Not allowed" };
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid payment" };
  const amount = roundMoney(parsed.data.amount);

  try {
    await prisma.$transaction(async (tx) => {
      if (parsed.data.consignmentId) {
        const c = await tx.consignment.findUnique({ where: { id: parsed.data.consignmentId } });
        if (!c || c.cancelled) throw new Error("Consignment not found");
        if (c.paymentType === "FOC") throw new Error("FOC consignments have no freight to collect");
        if (amount - c.balanceDue > 0.009) throw new Error("Payment exceeds outstanding balance");
        await tx.payment.create({
          data: {
            partyId: parsed.data.partyId,
            consignmentId: c.id,
            amount,
            mode: parsed.data.mode,
            purpose: parsed.data.purpose,
            reference: parsed.data.reference,
            notes: parsed.data.notes,
            collectorId: user.id,
            collectedAt: parsed.data.collectedAt ? new Date(parsed.data.collectedAt) : new Date(),
          },
        });
        await tx.consignment.update({
          where: { id: c.id },
          data: {
            freightPaidAmount: roundMoney(c.freightPaidAmount + amount),
            balanceDue: roundMoney(c.balanceDue - amount),
          },
        });
      } else {
        await tx.payment.create({
          data: {
            partyId: parsed.data.partyId,
            amount,
            mode: parsed.data.mode,
            purpose: parsed.data.purpose,
            reference: parsed.data.reference,
            notes: parsed.data.notes,
            collectorId: user.id,
            collectedAt: parsed.data.collectedAt ? new Date(parsed.data.collectedAt) : new Date(),
          },
        });
      }
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not record payment" };
  }

  revalidatePath("/payments");
  revalidatePath("/consignments");
  revalidatePath("/");
  return { ok: true };
}
