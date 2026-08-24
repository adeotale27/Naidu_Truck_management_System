"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { canWrite, requireUser } from "@/lib/auth";
import { driverSchema, truckSchema } from "@/lib/validations";
import type { z } from "zod";

function dateOrNull(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function createTruck(input: z.infer<typeof truckSchema>) {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "Not allowed" };
  const parsed = truckSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid truck" };
  const { insuranceExpiry, permitExpiry, pucExpiry, fitnessExpiry, ...rest } = parsed.data;
  try {
    await prisma.truck.create({
      data: {
        ...rest,
        insuranceExpiry: dateOrNull(insuranceExpiry),
        permitExpiry: dateOrNull(permitExpiry),
        pucExpiry: dateOrNull(pucExpiry),
        fitnessExpiry: dateOrNull(fitnessExpiry),
        active: rest.status !== "INACTIVE",
      },
    });
  } catch {
    return { error: "Could not save truck. Registration number may already exist." };
  }
  revalidatePath("/fleet");
  return { ok: true };
}

export async function updateTruck(id: string, input: z.infer<typeof truckSchema>) {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "Not allowed" };
  const parsed = truckSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid truck" };
  const { insuranceExpiry, permitExpiry, pucExpiry, fitnessExpiry, ...rest } = parsed.data;
  await prisma.truck.update({
    where: { id },
    data: {
      ...rest,
      insuranceExpiry: dateOrNull(insuranceExpiry),
      permitExpiry: dateOrNull(permitExpiry),
      pucExpiry: dateOrNull(pucExpiry),
      fitnessExpiry: dateOrNull(fitnessExpiry),
      active: rest.status !== "INACTIVE",
    },
  });
  revalidatePath("/fleet");
  return { ok: true };
}

export async function createDriver(input: z.infer<typeof driverSchema>) {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "Not allowed" };
  const parsed = driverSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid driver" };
  try {
    await prisma.driver.create({
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        licenseNo: parsed.data.licenseNo,
        licenseExpiry: dateOrNull(parsed.data.licenseExpiry),
        notes: parsed.data.notes,
        active: parsed.data.active ?? true,
      },
    });
  } catch {
    return { error: "Could not save driver. License number may already exist." };
  }
  revalidatePath("/fleet");
  return { ok: true };
}

export async function updateDriver(id: string, input: z.infer<typeof driverSchema>) {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "Not allowed" };
  const parsed = driverSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid driver" };
  await prisma.driver.update({
    where: { id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      licenseNo: parsed.data.licenseNo,
      licenseExpiry: dateOrNull(parsed.data.licenseExpiry),
      notes: parsed.data.notes,
      active: parsed.data.active ?? true,
    },
  });
  revalidatePath("/fleet");
  return { ok: true };
}
