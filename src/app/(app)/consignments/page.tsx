import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Money } from "@/components/money";
import { formatDate } from "@/lib/utils";

export default async function ConsignmentsPage({
  searchParams,
}: { searchParams: { q?: string; status?: string } }) {
  const q = searchParams.q?.trim();
  const rows = await prisma.consignment.findMany({
    where: {
      ...(searchParams.status ? { status: searchParams.status } : {}),
      ...(q ? { OR: [
        { lrNumber: { contains: q } },
        { consignor: { name: { contains: q } } },
        { consignee: { name: { contains: q } } },
        { trip: { tripNumber: { contains: q } } },
      ] } : {}),
    },
    include: { consignor: true, consignee: true, trip: true },
    orderBy: { bookedAt: "desc" },
    take: 200,
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Lorry receipts</h1>
        <Link href="/consignments/new" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white">New LR</Link>
      </div>
      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="LR, party or trip" className="h-10 flex-1 rounded-md border border-border bg-card px-3 text-sm" />
        <select name="status" defaultValue={searchParams.status ?? ""} className="h-10 rounded-md border border-border bg-card px-3 text-sm">
          <option value="">All</option>
          {["BOOKED","LOADED","IN_TRANSIT","DELIVERED","RETURNED_UNDELIVERED","CANCELLED"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="h-10 rounded-md border px-3 text-sm">Filter</button>
      </form>
      <Card>
        <CardHeader><CardTitle>{rows.length} receipts</CardTitle></CardHeader>
        <CardContent className="overflow-auto p-0">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card text-left text-muted-foreground">
              <tr><th className="px-5 py-2">LR</th><th>Date</th><th>Trip</th><th>Consignor</th><th>Consignee</th><th>Pay</th><th>Freight</th><th>Due</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-5 py-2"><Link className="font-mono text-primary" href={`/consignments/${c.id}`}>{c.lrNumber}</Link></td>
                  <td>{formatDate(c.bookedAt)}</td>
                  <td className="font-mono">{c.trip.tripNumber}</td>
                  <td>{c.consignor.name}</td>
                  <td>{c.consignee.name}</td>
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
    </div>
  );
}
