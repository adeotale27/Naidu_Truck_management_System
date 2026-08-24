"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createTrip } from "@/server/actions/trips";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/card";

export function TripForm({
  trucks,
  drivers,
  routes,
}: {
  trucks: { id: string; registrationNo: string }[];
  drivers: { id: string; name: string }[];
  routes: { id: string; name: string; origin: string; destination: string }[];
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      className="space-y-4 rounded-xl border border-border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await createTrip({
            truckId: String(fd.get("truckId")),
            driverId: String(fd.get("driverId")),
            routeId: String(fd.get("routeId")),
            direction: String(fd.get("direction")) as "OUTBOUND" | "RETURN",
            tripDate: String(fd.get("tripDate")),
            startOdometer: fd.get("startOdometer") ? Number(fd.get("startOdometer")) : null,
            notes: String(fd.get("notes") || "") || null,
          });
          if ("error" in res && res.error) {
            toast.error(res.error);
            return;
          }
          if ("trip" in res && res.trip) {
            toast.success(`Created ${res.trip.tripNumber}`);
            router.push(`/trips/${res.trip.id}`);
          }
        });
      }}
    >
      <div>
        <Label>Truck</Label>
        <select name="truckId" required className="mt-1 h-10 w-full rounded-md border border-border bg-card px-3 text-sm">
          {trucks.map((t) => <option key={t.id} value={t.id}>{t.registrationNo}</option>)}
        </select>
      </div>
      <div>
        <Label>Driver</Label>
        <select name="driverId" required className="mt-1 h-10 w-full rounded-md border border-border bg-card px-3 text-sm">
          {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div>
        <Label>Route</Label>
        <select name="routeId" required className="mt-1 h-10 w-full rounded-md border border-border bg-card px-3 text-sm">
          {routes.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.origin} → {r.destination})</option>)}
        </select>
      </div>
      <div>
        <Label>Direction</Label>
        <select name="direction" className="mt-1 h-10 w-full rounded-md border border-border bg-card px-3 text-sm">
          <option value="OUTBOUND">Outbound</option>
          <option value="RETURN">Return</option>
        </select>
      </div>
      <div>
        <Label>Trip date</Label>
        <Input type="date" name="tripDate" defaultValue={today} required />
      </div>
      <div>
        <Label>Start odometer</Label>
        <Input type="number" name="startOdometer" min={0} step="1" />
      </div>
      <div>
        <Label>Notes</Label>
        <Input name="notes" />
      </div>
      <Button disabled={pending} type="submit">Create trip</Button>
    </form>
  );
}
