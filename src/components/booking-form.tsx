"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createConsignment } from "@/server/actions/consignments";
import { PartyPicker } from "./party-picker";
import { Button } from "./ui/button";
import { Input, Textarea } from "./ui/input";
import { Label } from "./ui/card";

type TripOption = { id: string; tripNumber: string; label: string };

export function BookingForm({
  trips,
  defaultTripId,
}: {
  trips: TripOption[];
  defaultTripId?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const goodsRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tripId, setTripId] = useState(defaultTripId ?? trips[0]?.id ?? "");
  const [paymentType, setPaymentType] = useState("TO_PAY");

  function submit(mode: "save" | "another" | "print") {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    start(async () => {
      const res = await createConsignment({
        tripId: String(fd.get("tripId") || tripId),
        consignorId: String(fd.get("consignorId")),
        consigneeId: String(fd.get("consigneeId")),
        goodsDescription: String(fd.get("goodsDescription")),
        packageCount: Number(fd.get("packageCount")),
        weightKg: fd.get("weightKg") ? Number(fd.get("weightKg")) : null,
        declaredValue: fd.get("declaredValue") ? Number(fd.get("declaredValue")) : null,
        freightAmount: Number(fd.get("freightAmount")),
        paymentType: String(fd.get("paymentType")) as "PAID" | "TO_PAY" | "FOC",
        remarks: String(fd.get("remarks") || "") || null,
      });
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      if (!("consignment" in res) || !res.consignment) return;
      toast.success(`Saved ${res.consignment.lrNumber}`);
      if (mode === "print") {
        window.open(`/api/lr/${res.consignment.id}/pdf`, "_blank");
        router.push(`/consignments/${res.consignment.id}`);
        return;
      }
      if (mode === "another") {
        form.querySelectorAll<HTMLInputElement>('input[name="consigneeId"], input[name="goodsDescription"], input[name="packageCount"], input[name="weightKg"], input[name="declaredValue"], input[name="remarks"]').forEach((el) => {
          if (el.name === "packageCount") el.value = "1";
          else el.value = "";
        });
        const consigneeVisible = form.querySelectorAll("input")[2];
        goodsRef.current?.focus();
        void consigneeVisible;
        router.refresh();
        return;
      }
      router.push(`/consignments/${res.consignment.id}`);
    });
  }

  return (
    <form ref={formRef} className="grid gap-4 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
      <div className="md:col-span-2">
        <Label htmlFor="tripId">Trip</Label>
        <select
          id="tripId"
          name="tripId"
          value={tripId}
          onChange={(e) => setTripId(e.target.value)}
          className="mt-1 flex h-10 w-full cursor-pointer rounded-md border border-border bg-card px-3 text-sm"
          required
        >
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.tripNumber} — {t.label}
            </option>
          ))}
        </select>
      </div>
      <PartyPicker label="Consignor" name="consignorId" required />
      <PartyPicker label="Consignee" name="consigneeId" required />
      <div className="md:col-span-2">
        <Label htmlFor="goodsDescription">Goods</Label>
        <Input ref={goodsRef} id="goodsDescription" name="goodsDescription" required placeholder="Cement bags / steel / kirana" />
      </div>
      <div>
        <Label htmlFor="packageCount">Packages</Label>
        <Input id="packageCount" name="packageCount" type="number" min={1} defaultValue={1} required />
      </div>
      <div>
        <Label htmlFor="weightKg">Weight (kg)</Label>
        <Input id="weightKg" name="weightKg" type="number" min={0} step="0.01" />
      </div>
      <div>
        <Label htmlFor="declaredValue">Declared value (₹)</Label>
        <Input id="declaredValue" name="declaredValue" type="number" min={0} step="0.01" />
      </div>
      <div>
        <Label htmlFor="freightAmount">Freight (₹)</Label>
        <Input id="freightAmount" name="freightAmount" type="number" min={0} step="0.01" required />
      </div>
      <div>
        <Label htmlFor="paymentType">Payment type</Label>
        <select
          id="paymentType"
          name="paymentType"
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
          className="mt-1 flex h-10 w-full cursor-pointer rounded-md border border-border bg-card px-3 text-sm"
        >
          <option value="PAID">Paid</option>
          <option value="TO_PAY">To pay</option>
          <option value="FOC">FOC</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea id="remarks" name="remarks" rows={2} />
      </div>
      <div className="md:col-span-2 flex flex-wrap gap-2">
        <Button type="button" disabled={pending} onClick={() => submit("save")}>
          Save
        </Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => submit("another")}>
          Save & add another
        </Button>
        <Button type="button" variant="accent" disabled={pending} onClick={() => submit("print")}>
          Save & print LR
        </Button>
      </div>
    </form>
  );
}
