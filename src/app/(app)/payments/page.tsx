import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/money";
import { formatDateTime } from "@/lib/utils";
import { PaymentForm } from "@/components/payment-form";
import { StatusBadge } from "@/components/status-badge";

export default async function PaymentsPage() {
  const [payments, outstanding, parties] = await Promise.all([
    prisma.payment.findMany({ include: { party: true, consignment: true, collector: true }, orderBy: { collectedAt: "desc" }, take: 100 }),
    prisma.consignment.findMany({
      where: { cancelled: false, balanceDue: { gt: 0 } },
      include: { consignee: true, consignor: true, trip: true },
      orderBy: { bookedAt: "asc" },
      take: 100,
    }),
    prisma.party.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  const start = new Date(); start.setHours(0,0,0,0);
  const today = payments.filter((p) => p.collectedAt >= start && !p.cancelled);
  const byMode: Record<string, number> = {};
  for (const p of today) byMode[p.mode] = (byMode[p.mode] ?? 0) + p.amount;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Payments</h1>
      <div className="grid gap-3 md:grid-cols-5">
        {["CASH","UPI","BANK_TRANSFER","OTHER"].map((m) => (
          <Card key={m}><CardHeader><CardTitle className="text-xs">{m.replace("_"," ")}</CardTitle></CardHeader><CardContent><Money value={byMode[m] ?? 0} /></CardContent></Card>
        ))}
        <Card><CardHeader><CardTitle className="text-xs">Today count</CardTitle></CardHeader><CardContent>{today.length}</CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Record payment</CardTitle></CardHeader>
        <CardContent>
          <PaymentForm parties={parties.map((p) => ({ id: p.id, name: p.name }))} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>To-Pay outstanding</CardTitle></CardHeader>
        <CardContent className="overflow-auto p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="px-5 py-2">LR</th><th>Party</th><th>Trip</th><th>Due</th></tr></thead>
            <tbody>
              {outstanding.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-5 py-2 font-mono">{c.lrNumber}</td>
                  <td>{c.paymentType === "TO_PAY" ? c.consignee.name : c.consignor.name}</td>
                  <td>{c.trip.tripNumber}</td>
                  <td><Money value={c.balanceDue} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Recent collections</CardTitle></CardHeader>
        <CardContent className="overflow-auto p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="px-5 py-2">When</th><th>Party</th><th>LR</th><th>Mode</th><th>Purpose</th><th>Amount</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-5 py-2">{formatDateTime(p.collectedAt)}</td>
                  <td>{p.party.name}</td>
                  <td className="font-mono">{p.consignment?.lrNumber ?? "—"}</td>
                  <td><StatusBadge status={p.mode} /></td>
                  <td>{p.purpose.replaceAll("_"," ")}</td>
                  <td><Money value={p.amount} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
