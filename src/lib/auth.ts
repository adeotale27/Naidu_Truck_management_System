import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import type { Role } from "./constants";

export type SessionUser = { id: string; name: string; role: Role };

const COOKIE = "tl_session";

function secret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || "truckledger-local-dev-secret-change-me");
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  cookies().set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export async function destroySession() {
  cookies().delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return { id: payload.sub, name: String(payload.name ?? ""), role: payload.role as Role };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || !user.active) throw new Error("UNAUTHENTICATED");
  return { ...session, role: user.role as Role, name: user.name };
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}

export function canWrite(role: Role) {
  return role === "OWNER" || role === "BOOKING_CLERK";
}

export function isOwner(role: Role) {
  return role === "OWNER";
}
