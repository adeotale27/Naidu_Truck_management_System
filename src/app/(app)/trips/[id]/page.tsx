import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Money } from "@/components/money";
import { formatDate } from "@/lib/utils";
import { TripActions } from "@/components/trip-actions";
import { ExpenseForm } from "@/components/expense-form";

export default async function TripDetailPage({ params }: { params: { id: string } }) {
  const trip = await prisma.trip.findUnique({
    where: { id: params.id },
    include: {
      truck: true,
      driver: true,
      route: true,
      expenses: { where: { cancelled: false } },
      consignments: {
        where: { cancelled: false },
        include: { consignor: true, consignee: true },
        orderBy: { lrNumber: "asc" },
      },
    },
  });
  if (!trip) notFound();
  const freight = trip.consignments.reduce((s, c) => s + c.freightAmount, 0);
  const paid = trip.consignments.reduce((s, c) => s + c.freightPaidAmount, 0);
  const due = trip.consignments.reduce((s, c) => s + c.balanceDue, 0);
  const exp = trip.expenses.reduce((s, e) => s + e.amount, 0);
  const pnl = paid - exp;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-muted-foreground">{trip.tripNumber}</p>
          <h1 className="font-display text-3xl">{trip.route.origin} → {trip.route.destination}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(trip.tripDate)} · {trip.truck.registrationNo} · {trip.driver.name} · {trip.direction === "RETURN" ? "Return" : "Outbound"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={trip.status} />
          <Link href={`/consignments/new?tripId=${trip.id}`} className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white">Add LR</Link>
        </div>
      </div>
      <TripActions id={trip.id} status={trip.status} />
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-sm">Freight</CardTitle></CardHeader><CardContent><Money value={freight} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Collected</CardTitle></CardHeader><CardContent><Money value={paid} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">To-Pay due</CardTitle></CardHeader><CardContent><Money value={due} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Trip P&amp;L</CardTitle></CardHeader><CardContent><Money value={pnl} /> <span className="text-xs text-muted-foreground">after expenses { }
          </span></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Consignments ({trip.consignments.length})</CardTitle></CardHeader>
        <CardContent className="max-h-[480px] overflow-auto p-0">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card text-left text-muted-foreground">
              <tr><th className="px-5 py-2">LR</th><th>Consignor</th><th>Consignee</th><th>Goods</th><th>Pay</th><th>Freight</th><th>Due</th><th>Status</th></tr>
            </thead>
            <tbody>
              {trip.consignments.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-5 py-2"><Link className="font-mono text-primary" href={`/consignments/${c.id}`}>{c.lrNumber}</Link></td>
                  <td>{c.consignor.name}</td>
                  <td>{c.consignee.name}</td>
                  <td>{c.goodsDescription}</td>
                  <td><StatusBadge status={c.paymentType} /></td>
                  <td><Money value={c.freightAmount} /></td>
                  <td><Money value={c.balanceDue} /></td>
                  <td><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Expenses</CardTitle></CardHeader>
          <CardContent>
            <ul className="mb-4 space-y-2 text-sm">
              {trip.expenses.map((e) => (
                <li key={e.id} className="flex justify-between"><span>{e.type.replaceAll("_", " ")}</span><Money value={e.amount} /></li>
              ))}
            </ul>
            <ExpenseForm tripId={trip.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
