import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Money } from "@/components/money";
import { BookingsChart } from "@/components/bookings-chart";

export default async function DashboardPage() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  const from14 = new Date(start);
  from14.setDate(start.getDate() - 13);

  const [todayTrips, trucks, collected, outstanding, pending, booked] = await Promise.all([
    prisma.trip.findMany({
      where: { tripDate: { gte: start, lt: end }, cancelled: false },
      include: { truck: true, route: true, _count: { select: { consignments: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.truck.findMany(),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { cancelled: false, collectedAt: { gte: start, lt: end } },
    }),
    prisma.consignment.aggregate({
      _sum: { balanceDue: true },
      where: { cancelled: false, paymentType: "TO_PAY", balanceDue: { gt: 0 } },
    }),
    prisma.consignment.count({
      where: { cancelled: false, status: { in: ["BOOKED", "LOADED", "IN_TRANSIT"] } },
    }),
    prisma.consignment.findMany({
      where: { bookedAt: { gte: from14 }, cancelled: false },
      select: { bookedAt: true },
    }),
  ]);

  const chart = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(from14);
    d.setDate(from14.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const count = booked.filter((b) => b.bookedAt.toISOString().slice(0, 10) === key).length;
    return { date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), count };
  });

  const onRoad = trucks.filter((t) => t.status === "ON_ROAD").length;
  const idle = trucks.filter((t) => t.status === "IDLE" || t.status === "ACTIVE").length;
  const maint = trucks.filter((t) => t.status === "MAINTENANCE" || t.status === "INACTIVE").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Office desk</h1>
          <p className="text-sm text-muted-foreground">Nagpur ↔ Hinganghat · Wadi ↔ Hinganghat</p>
        </div>
        <div className="flex gap-2">
          <Link href="/trips/new" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-white">New trip</Link>
          <Link href="/consignments/new" className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-medium text-white">New consignment</Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Freight collected today</CardTitle></CardHeader>
          <CardContent><Money value={collected._sum.amount ?? 0} className="text-2xl" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">To-Pay outstanding</CardTitle></CardHeader>
          <CardContent><Money value={outstanding._sum.balanceDue ?? 0} className="text-2xl" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Pending deliveries</CardTitle></CardHeader>
          <CardContent><p className="font-display text-2xl">{pending}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Fleet</CardTitle></CardHeader>
          <CardContent><p className="text-sm">On road {onRoad} · Idle {idle} · Maint/off {maint}</p></CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Today&apos;s trips</CardTitle></CardHeader>
          <CardContent>
            {todayTrips.length === 0 ? (
              <p className="text-sm text-muted-foreground">No trips dated today.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2">Trip</th><th>Truck</th><th>Route</th><th>Dir</th><th>Status</th><th>LRs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayTrips.map((t) => (
                      <tr key={t.id} className="border-t border-border">
                        <td className="py-2">
                          <Link className="font-mono text-primary" href={`/trips/${t.id}`}>{t.tripNumber}</Link>
                        </td>
                        <td className="font-mono">{t.truck.registrationNo}</td>
                        <td>{t.route.origin} → {t.route.destination}</td>
                        <td>{t.direction === "RETURN" ? "Return" : "Outbound"}</td>
                        <td><StatusBadge status={t.status} /></td>
                        <td>{t._count.consignments}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Bookings · 14 days</CardTitle></CardHeader>
          <CardContent><BookingsChart data={chart} /></CardContent>
        </Card>
      </div>
    </div>
  );
}
