"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { createUserAccount, resetUserPin, saveCompany, saveRoute, setUserActive } from "@/server/actions/settings";
import { Button } from "./ui/button";
import { Input, Textarea } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle, Label } from "./ui/card";

export function SettingsForms({
  company,
  routes,
  users,
}: {
  company: { name: string; address: string; phone: string; gstin: string | null; email: string | null; lrDisclaimer: string | null } | null;
  routes: { id: string; name: string; origin: string; destination: string; distanceKm: number | null; standardFreight: number | null }[];
  users: { id: string; name: string; role: string; active: boolean }[];
}) {
  const [pending, start] = useTransition();
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Company / LR header</CardTitle></CardHeader>
        <CardContent>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              start(async () => {
                const res = await saveCompany({
                  name: String(fd.get("name")),
                  address: String(fd.get("address")),
                  phone: String(fd.get("phone")),
                  gstin: String(fd.get("gstin") || "") || null,
                  email: String(fd.get("email") || "") || null,
                  lrDisclaimer: String(fd.get("lrDisclaimer") || "") || null,
                });
                if (res.error) toast.error(res.error);
                else toast.success("Company saved");
              });
            }}
          >
            <Label>Name</Label>
            <Input name="name" defaultValue={company?.name} required />
            <Label>Address</Label>
            <Input name="address" defaultValue={company?.address} required />
            <Label>Phone</Label>
            <Input name="phone" defaultValue={company?.phone} required />
            <Label>GSTIN</Label>
            <Input name="gstin" defaultValue={company?.gstin ?? ""} />
            <Label>Email</Label>
            <Input name="email" defaultValue={company?.email ?? ""} />
            <Label>LR disclaimer</Label>
            <Textarea name="lrDisclaimer" defaultValue={company?.lrDisclaimer ?? ""} />
            <Button disabled={pending} type="submit">Save company</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Routes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {routes.map((r) => (
            <p key={r.id} className="text-sm">{r.name} · {r.origin} → {r.destination} · {r.distanceKm ?? "—"} km</p>
          ))}
          <form
            className="grid gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              start(async () => {
                const res = await saveRoute({
                  name: String(fd.get("name")),
                  origin: String(fd.get("origin")),
                  destination: String(fd.get("destination")),
                  distanceKm: fd.get("distanceKm") ? Number(fd.get("distanceKm")) : null,
                  standardFreight: fd.get("standardFreight") ? Number(fd.get("standardFreight")) : null,
                });
                if (res.error) toast.error(res.error);
                else {
                  toast.success("Route saved");
                  (e.target as HTMLFormElement).reset();
                }
              });
            }}
          >
            <Input name="name" placeholder="Name" required />
            <div className="grid grid-cols-2 gap-2">
              <Input name="origin" placeholder="Origin" required />
              <Input name="destination" placeholder="Destination" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input name="distanceKm" type="number" placeholder="Km" />
              <Input name="standardFreight" type="number" placeholder="Std freight" />
            </div>
            <Button type="submit" size="sm">Add route</Button>
          </form>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <CardContent>
          <ul className="mb-4 space-y-2 text-sm">
            {users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2">
                <span>{u.name} · {u.role} · {u.active ? "active" : "inactive"}</span>
                <span className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => start(async () => {
                    const pin = window.prompt("New PIN (4-8 digits)") ?? "";
                    const res = await resetUserPin(u.id, pin);
                    if (res.error) toast.error(res.error); else toast.success("PIN reset");
                  })}>Reset PIN</Button>
                  <Button size="sm" variant="ghost" onClick={() => start(async () => {
                    const res = await setUserActive(u.id, !u.active);
                    if (res.error) toast.error(res.error); else toast.success("Updated");
                  })}>{u.active ? "Deactivate" : "Activate"}</Button>
                </span>
              </li>
            ))}
          </ul>
          <form
            className="grid gap-2 md:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              start(async () => {
                const res = await createUserAccount({
                  name: String(fd.get("name")),
                  role: String(fd.get("role")) as "OWNER" | "BOOKING_CLERK" | "DRIVER",
                  pin: String(fd.get("pin")),
                });
                if (res.error) toast.error(res.error);
                else toast.success("User created");
              });
            }}
          >
            <Input name="name" placeholder="Name" required />
            <select name="role" className="h-10 rounded-md border px-2 text-sm">
              <option>OWNER</option>
              <option>BOOKING_CLERK</option>
              <option>DRIVER</option>
            </select>
            <Input name="pin" placeholder="PIN" required />
            <Button type="submit" className="md:col-span-3">Create user</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
