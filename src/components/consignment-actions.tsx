"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { markReturned, updateConsignmentStatus } from "@/server/actions/consignments";
import { consignmentStatusFlow } from "@/lib/constants";
import { Button } from "./ui/button";

export function ConsignmentActions({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const next = (consignmentStatusFlow[status] ?? []).filter((s) => s !== "DELIVERED");
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
              const res = await updateConsignmentStatus(id, s);
              if (res.error) toast.error(res.error);
              else {
                toast.success("Updated");
                router.refresh();
              }
            })
          }
        >
          {s.replaceAll("_", " ")}
        </Button>
      ))}
      {status !== "DELIVERED" && status !== "CANCELLED" && status !== "RETURNED_UNDELIVERED" && (
        <Button
          size="sm"
          variant="danger"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await markReturned(id);
              if (res.error) toast.error(res.error);
              else {
                toast.success("Marked returned undelivered");
                router.refresh();
              }
            })
          }
        >
          Returned undelivered
        </Button>
      )}
    </div>
  );
}
