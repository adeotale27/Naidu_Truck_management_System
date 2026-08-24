"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateTripStatus } from "@/server/actions/trips";
import { tripStatusFlow } from "@/lib/constants";
import { Button } from "./ui/button";

export function TripActions({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const next = tripStatusFlow[status] ?? [];
  return (
    <div className="flex flex-wrap gap-2">
      {next.map((s) => (
        <Button
          key={s}
          size="sm"
          variant={s === "CANCELLED" ? "danger" : "outline"}
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await updateTripStatus(id, s);
              if (res.error) toast.error(res.error);
              else {
                toast.success(`Trip ${s.replaceAll("_", " ").toLowerCase()}`);
                router.refresh();
              }
            })
          }
        >
          Mark {s.replaceAll("_", " ").toLowerCase()}
        </Button>
      ))}
    </div>
  );
}
