"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { recordPayment } from "@/server/actions/payments";
import { PAYMENT_MODES, PAYMENT_PURPOSES } from "@/lib/constants";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function PaymentForm({
  partyId,
  consignmentId,
  defaultAmount,
  parties,
}: {
  partyId?: string;
  consignmentId?: string;
  defaultAmount?: number;
  parties?: { id: string; name: string }[];
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await recordPayment({
            partyId: String(fd.get("partyId") || partyId),
            consignmentId: consignmentId || (String(fd.get("consignmentId") || "") || null),
            amount: Number(fd.get("amount")),
            mode: String(fd.get("mode")) as (typeof PAYMENT_MODES)[number],
            purpose: String(fd.get("purpose")) as (typeof PAYMENT_PURPOSES)[number],
            reference: String(fd.get("reference") || "") || null,
          });
          if (res.error) toast.error(res.error);
          else {
            toast.success("Payment recorded");
            (e.target as HTMLFormElement).reset();
            router.refresh();
          }
        });
      }}
    >
      {parties ? (
        <select name="partyId" required className="h-10 rounded-md border border-border px-2 text-sm md:col-span-2">
          {parties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      ) : (
        <input type="hidden" name="partyId" value={partyId} />
      )}
      <select name="mode" className="h-10 rounded-md border px-2 text-sm">
        {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
      </select>
      <select name="purpose" defaultValue={consignmentId ? "TO_PAY_SETTLEMENT" : "FREIGHT_COLLECTION"} className="h-10 rounded-md border px-2 text-sm">
        {PAYMENT_PURPOSES.map((m) => <option key={m}>{m}</option>)}
      </select>
      <Input name="amount" type="number" min={0.01} step="0.01" defaultValue={defaultAmount} required placeholder="Amount" />
      <Input name="reference" placeholder="UPI / bank ref" />
      <Button type="submit" disabled={pending} className="md:col-span-2">Record payment</Button>
    </form>
  );
}
