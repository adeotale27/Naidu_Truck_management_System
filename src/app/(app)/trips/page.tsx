import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

export default async function TripsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const q = searchParams.q?.trim();
  const trips = await prisma.trip.findMany({
    where: {
      ...(searchParams.status ? { status: searchParams.status } : {}),
      ...(q
        ? {
            OR: [
              { tripNumber: { contains: q } },
              { truck: { registrationNo: { contains: q } } },
            ],
          }
        : {}),
    },
    include: { truck: true, driver: true, route: true, _count: { select: { consignments: true } } },
    orderBy: { tripDate: "desc" },
    take: 200,
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Trips</h1>
        <Link href="/trips/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white">New trip</Link>
      </div>
      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Trip no or truck" className="h-10 flex-1 rounded-md border border-border bg-card px-3 text-sm" />
        <select name="status" defaultValue={searchParams.status ?? ""} className="h-10 rounded-md border border-border bg-card px-3 text-sm">
          <option value="">All statuses</option>
          {["PLANNED", "LOADING", "IN_TRANSIT", "ARRIVED", "COMPLETED", "CANCELLED"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button className="h-10 rounded-md border border-border px-3 text-sm">Filter</button>
      </form>
      <Card>
        <CardHeader><CardTitle>{trips.length} trips</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card text-left text-muted-foreground">
              <tr>
                <th className="px-5 py-2">Trip</th><th>Date</th><th>Truck</th><th>Driver</th><th>Route</th><th>Dir</th><th>Status</th><th>LRs</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-5 py-2"><Link className="font-mono text-primary" href={`/trips/${t.id}`}>{t.tripNumber}</Link></td>
                  <td>{formatDate(t.tripDate)}</td>
                  <td className="font-mono">{t.truck.registrationNo}</td>
                  <td>{t.driver.name}</td>
                  <td>{t.route.origin} → {t.route.destination}</td>
                  <td>{t.direction === "RETURN" ? "Return" : "Outbound"}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td>{t._count.consignments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
