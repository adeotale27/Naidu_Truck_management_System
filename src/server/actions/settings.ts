"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { companySchema, routeSchema, userSchema } from "@/lib/validations";
import type { z } from "zod";

export async function saveCompany(input: z.infer<typeof companySchema>) {
  await requireRole(["OWNER"]);
  const parsed = companySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid company" };
  await prisma.companySettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...parsed.data },
    update: parsed.data,
  });
  revalidatePath("/settings");
  return { ok: true };
}

export async function saveRoute(input: z.infer<typeof routeSchema> & { id?: string }) {
  await requireRole(["OWNER"]);
  const parsed = routeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid route" };
  try {
    if (input.id) await prisma.route.update({ where: { id: input.id }, data: parsed.data });
    else await prisma.route.create({ data: parsed.data });
  } catch {
    return { error: "Could not save route. Origin/destination may already exist." };
  }
  revalidatePath("/settings");
  return { ok: true };
}

export async function createUserAccount(input: z.infer<typeof userSchema>) {
  await requireRole(["OWNER"]);
  const parsed = userSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid user" };
  const pinHash = await bcrypt.hash(parsed.data.pin, 10);
  await prisma.user.create({ data: { name: parsed.data.name, role: parsed.data.role, pinHash, active: true } });
  revalidatePath("/settings");
  return { ok: true };
}

export async function resetUserPin(id: string, pin: string) {
  await requireRole(["OWNER"]);
  if (!/^\d{4,8}$/.test(pin)) return { error: "PIN must be 4-8 digits" };
  await prisma.user.update({ where: { id }, data: { pinHash: await bcrypt.hash(pin, 10) } });
  revalidatePath("/settings");
  return { ok: true };
}

export async function setUserActive(id: string, active: boolean) {
  const actor = await requireRole(["OWNER"]);
  if (actor.id === id && !active) return { error: "You cannot deactivate yourself" };
  await prisma.user.update({ where: { id }, data: { active } });
  revalidatePath("/settings");
  return { ok: true };
}
