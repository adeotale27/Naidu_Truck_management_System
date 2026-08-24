import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Money } from "@/components/money";
import { formatDate, formatDateTime } from "@/lib/utils";
import { PodForm } from "@/components/pod-form";
import { PaymentForm } from "@/components/payment-form";
import { ConsignmentActions } from "@/components/consignment-actions";

export default async function ConsignmentDetailPage({ params }: { params: { id: string } }) {
  const c = await prisma.consignment.findUnique({
    where: { id: params.id },
    include: { trip: { include: { truck: true, driver: true, route: true } }, consignor: true, consignee: true, pod: true, payments: true, items: true },
  });
  if (!c) notFound();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-muted-foreground">{c.lrNumber}</p>
          <h1 className="font-display text-3xl">{c.origin} → {c.destination}</h1>
          <p className="text-sm text-muted-foreground">Booked {formatDate(c.bookedAt)} · Trip <Link className="text-primary" href={`/trips/${c.tripId}`}>{c.trip.tripNumber}</Link></p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={c.status} />
          <a className="rounded-md border border-border px-3 py-2 text-sm" href={`/api/lr/${c.id}/pdf`} target="_blank">Print LR</a>
        </div>
      </div>
      <ConsignmentActions id={c.id} status={c.status} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Parties & goods</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Consignor</span> · {c.consignor.name} {c.consignor.phone ?? ""}</p>
            <p><span className="text-muted-foreground">Consignee</span> · {c.consignee.name} {c.consignee.phone ?? ""}</p>
            <p>{c.goodsDescription} · {c.packageCount} pkgs · {c.weightKg ?? "—"} kg</p>
            <p>Truck {c.trip.truck.registrationNo} · Driver {c.trip.driver.name}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Freight</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Type <StatusBadge status={c.paymentType} /></p>
            <p>Freight <Money value={c.freightAmount} /></p>
            <p>Paid <Money value={c.freightPaidAmount} /></p>
            <p>Balance <Money value={c.balanceDue} className="text-lg" /></p>
          </CardContent>
        </Card>
      </div>
      {c.status !== "DELIVERED" && c.status !== "CANCELLED" && (
        <Card><CardHeader><CardTitle>Proof of delivery</CardTitle></CardHeader><CardContent><PodForm consignmentId={c.id} /></CardContent></Card>
      )}
      {c.pod && (
        <Card>
          <CardHeader><CardTitle>POD captured</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {c.pod.receiverName} · {c.pod.receiverPhone ?? "—"} · {formatDateTime(c.pod.deliveredAt)}
            {c.pod.remarks ? <p>{c.pod.remarks}</p> : null}
          </CardContent>
        </Card>
      )}
      {c.balanceDue > 0 && (
        <Card>
          <CardHeader><CardTitle>Collect payment</CardTitle></CardHeader>
          <CardContent>
            <PaymentForm partyId={c.paymentType === "TO_PAY" ? c.consigneeId : c.consignorId} consignmentId={c.id} defaultAmount={c.balanceDue} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
