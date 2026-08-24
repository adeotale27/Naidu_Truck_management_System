import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/money";
import { ReportsExport } from "@/components/reports-export";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const to = searchParams.to ? new Date(searchParams.to) : new Date();
  const from = searchParams.from ? new Date(searchParams.from) : new Date(to.getTime() - 30 * 86400000);
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  const trips = await prisma.trip.findMany({
    where: { tripDate: { gte: from, lte: to }, cancelled: false },
    include: { truck: true, route: true, consignments: true, expenses: { where: { cancelled: false } } },
  });
  const pnl = trips.map((t) => {
    const freight = t.consignments.reduce((s, c) => s + c.freightPaidAmount, 0);
    const exp = t.expenses.reduce((s, e) => s + e.amount, 0);
    return { tripNumber: t.tripNumber, truck: t.truck.registrationNo, route: `${t.route.origin}→${t.route.destination}`, freight, exp, pnl: freight - exp };
  });
  const parties = await prisma.party.findMany({
    include: {
      consignmentsAsConsignor: { where: { bookedAt: { gte: from, lte: to }, cancelled: false } },
      consignmentsAsConsignee: { where: { bookedAt: { gte: from, lte: to }, cancelled: false } },
    },
  });
  const partyRows = parties
    .map((p) => {
      const all = [...p.consignmentsAsConsignor, ...p.consignmentsAsConsignee];
      const unique = new Map(all.map((c) => [c.id, c]));
      const list = Array.from(unique.values());
      return {
        name: p.name,
        count: list.length,
        freight: list.reduce((s, c) => s + c.freightAmount, 0),
        collected: list.reduce((s, c) => s + c.freightPaidAmount, 0),
        outstanding: list.reduce((s, c) => s + c.balanceDue, 0),
      };
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.freight - a.freight);

  const volume = new Map<string, number>();
  for (const t of trips) {
    const key = `${t.route.origin} ↔ ${t.route.destination}`;
    volume.set(key, (volume.get(key) ?? 0) + t.consignments.length);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Reports</h1>
        <ReportsExport />
      </div>
      <form className="flex gap-2">
        <input type="date" name="from" defaultValue={from.toISOString().slice(0, 10)} className="h-10 rounded-md border px-2 text-sm" />
        <input type="date" name="to" defaultValue={to.toISOString().slice(0, 10)} className="h-10 rounded-md border px-2 text-sm" />
        <button className="h-10 rounded-md border px-3 text-sm">Apply</button>
      </form>
      <Card>
        <CardHeader><CardTitle>Trip P&amp;L</CardTitle></CardHeader>
        <CardContent className="overflow-auto p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="px-5 py-2">Trip</th><th>Truck</th><th>Route</th><th>Collected</th><th>Expenses</th><th>P&L</th></tr></thead>
            <tbody>
              {pnl.map((r) => (
                <tr key={r.tripNumber} className="border-t border-border">
                  <td className="px-5 py-2 font-mono">{r.tripNumber}</td>
                  <td>{r.truck}</td>
                  <td>{r.route}</td>
                  <td><Money value={r.freight} /></td>
                  <td><Money value={r.exp} /></td>
                  <td><Money value={r.pnl} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Party freight summary</CardTitle></CardHeader>
        <CardContent className="overflow-auto p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="px-5 py-2">Party</th><th>LRs</th><th>Freight</th><th>Collected</th><th>Outstanding</th></tr></thead>
            <tbody>
              {partyRows.map((r) => (
                <tr key={r.name} className="border-t border-border">
                  <td className="px-5 py-2">{r.name}</td>
                  <td>{r.count}</td>
                  <td><Money value={r.freight} /></td>
                  <td><Money value={r.collected} /></td>
                  <td><Money value={r.outstanding} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Route volume</CardTitle></CardHeader>
        <CardContent>
          {Array.from(volume.entries()).map(([k, v]) => (
            <p key={k} className="flex justify-between text-sm"><span>{k}</span><span>{v} LRs</span></p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
