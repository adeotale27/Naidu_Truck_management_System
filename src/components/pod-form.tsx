"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { markDelivered } from "@/server/actions/consignments";
import { SignaturePad } from "./signature-pad";
import { Button } from "./ui/button";
import { Input, Textarea } from "./ui/input";
import { Label } from "./ui/card";

export function PodForm({ consignmentId }: { consignmentId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await markDelivered({
            consignmentId,
            receiverName: String(fd.get("receiverName")),
            receiverPhone: String(fd.get("receiverPhone") || "") || null,
            deliveredAt: String(fd.get("deliveredAt")),
            remarks: String(fd.get("remarks") || "") || null,
            signaturePath: String(fd.get("signature") || "") || null,
          });
          if (res.error) toast.error(res.error);
          else {
            toast.success("Delivery recorded");
            router.refresh();
          }
        });
      }}
    >
      <div>
        <Label>Receiver name</Label>
        <Input name="receiverName" required />
      </div>
      <div>
        <Label>Phone</Label>
        <Input name="receiverPhone" />
      </div>
      <div className="md:col-span-2">
        <Label>Delivered at</Label>
        <Input name="deliveredAt" type="datetime-local" defaultValue={now.toISOString().slice(0, 16)} required />
      </div>
      <div className="md:col-span-2">
        <Label>Remarks</Label>
        <Textarea name="remarks" />
      </div>
      <div className="md:col-span-2">
        <Label>Signature</Label>
        <SignaturePad name="signature" />
      </div>
      <Button type="submit" disabled={pending} className="md:col-span-2">Mark delivered</Button>
    </form>
  );
}
