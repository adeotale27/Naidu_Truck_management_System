"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function globalSearch(q: string) {
  await requireUser();
  const query = q.trim();
  if (query.length < 2) return { consignments: [], trips: [], parties: [], trucks: [] };
  const [consignments, trips, parties, trucks] = await Promise.all([
    prisma.consignment.findMany({
      where: { lrNumber: { contains: query } },
      select: { id: true, lrNumber: true, status: true },
      take: 8,
    }),
    prisma.trip.findMany({
      where: { tripNumber: { contains: query } },
      select: { id: true, tripNumber: true, status: true },
      take: 8,
    }),
    prisma.party.findMany({
      where: { OR: [{ name: { contains: query } }, { phone: { contains: query } }] },
      select: { id: true, name: true, city: true },
      take: 8,
    }),
    prisma.truck.findMany({
      where: { registrationNo: { contains: query } },
      select: { id: true, registrationNo: true, status: true },
      take: 8,
    }),
  ]);
  return { consignments, trips, parties, trucks };
}
