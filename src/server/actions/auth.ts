"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import type { Role } from "@/lib/constants";

export async function login(userId: string, pin: string) {
  const parsed = loginSchema.safeParse({ userId, pin });
  if (!parsed.success) return { error: "Enter a valid PIN" };
  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user || !user.active) return { error: "User not found or inactive" };
  const ok = await bcrypt.compare(parsed.data.pin, user.pinHash);
  if (!ok) return { error: "Incorrect PIN" };
  await createSession({ id: user.id, name: user.name, role: user.role as Role });
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function listActiveUsers() {
  return prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}
