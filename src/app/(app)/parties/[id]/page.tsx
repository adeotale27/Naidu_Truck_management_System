import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/money";
import { StatusBadge } from "@/components/status-badge";

export default async function PartyDetailPage({ params }: { params: { id: string } }) {
  const party = await prisma.party.findUnique({
    where: { id: params.id },
    include: {
      consignmentsAsConsignor: { include: { consignee: true }, orderBy: { bookedAt: "desc" }, take: 50 },
      consignmentsAsConsignee: { include: { consignor: true }, orderBy: { bookedAt: "desc" }, take: 50 },
      payments: { orderBy: { collectedAt: "desc" }, take: 30 },
    },
  });
  if (!party) notFound();
  const asConsignorFreight = party.consignmentsAsConsignor.reduce((s, c) => s + c.freightAmount, 0);
  const asConsigneeDue = party.consignmentsAsConsignee.reduce((s, c) => s + c.balanceDue, 0);
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">{party.name}</h1>
      <p className="text-sm text-muted-foreground">{[party.city, party.phone, party.gstin].filter(Boolean).join(" · ")}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Freight as consignor</CardTitle></CardHeader><CardContent><Money value={asConsignorFreight} className="text-2xl" /></CardContent></Card>
        <Card><CardHeader><CardTitle>Outstanding as consignee</CardTitle></CardHeader><CardContent><Money value={asConsigneeDue} className="text-2xl" /></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Recent LRs as consignor</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          {party.consignmentsAsConsignor.map((c) => (
            <p key={c.id}><Link className="font-mono text-primary" href={`/consignments/${c.id}`}>{c.lrNumber}</Link> → {c.consignee.name} <StatusBadge status={c.status} /></p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
