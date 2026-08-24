import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const trips = await prisma.trip.findMany({
    include: { truck: true, route: true, consignments: true, expenses: true },
    orderBy: { tripDate: "desc" },
    take: 200,
  });
  const rows = trips.map((t) => ({
    trip: t.tripNumber,
    date: t.tripDate.toISOString().slice(0, 10),
    truck: t.truck.registrationNo,
    route: `${t.route.origin} -> ${t.route.destination}`,
    freightCollected: t.consignments.reduce((s, c) => s + c.freightPaidAmount, 0),
    expenses: t.expenses.reduce((s, e) => s + e.amount, 0),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Trip PnL");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=truckledger-reports.xlsx",
    },
  });
}
