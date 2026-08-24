"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { canWrite, requireRole, requireUser } from "@/lib/auth";
import { partySchema } from "@/lib/validations";
import type { z } from "zod";

export async function searchParties(q: string) {
  await requireUser();
  const query = q.trim();
  return prisma.party.findMany({
    where: query
      ? {
          active: true,
          OR: [
            { name: { contains: query } },
            { city: { contains: query } },
            { phone: { contains: query } },
            { gstin: { contains: query } },
          ],
        }
      : { active: true },
    take: 20,
    orderBy: { name: "asc" },
  });
}

export async function createParty(input: z.infer<typeof partySchema>) {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "Not allowed" };
  const parsed = partySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid party" };
  const party = await prisma.party.create({ data: parsed.data });
  revalidatePath("/parties");
  revalidatePath("/consignments");
  return { party };
}

export async function updateParty(id: string, input: z.infer<typeof partySchema>) {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "Not allowed" };
  const parsed = partySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid party" };
  await prisma.party.update({ where: { id }, data: parsed.data });
  revalidatePath("/parties");
  revalidatePath(`/parties/${id}`);
  return { ok: true };
}

export async function deactivateParty(id: string) {
  await requireRole(["OWNER"]);
  await prisma.party.update({ where: { id }, data: { active: false } });
  revalidatePath("/parties");
  return { ok: true };
}
