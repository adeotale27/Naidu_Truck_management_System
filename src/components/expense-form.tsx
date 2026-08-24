"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { addExpense } from "@/server/actions/trips";
import { EXPENSE_TYPES } from "@/lib/constants";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function ExpenseForm({ tripId }: { tripId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="grid grid-cols-2 gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await addExpense({
            tripId,
            type: String(fd.get("type")) as (typeof EXPENSE_TYPES)[number],
            amount: Number(fd.get("amount")),
            notes: String(fd.get("notes") || "") || null,
          });
          if (res.error) toast.error(res.error);
          else {
            toast.success("Expense added");
            (e.target as HTMLFormElement).reset();
            router.refresh();
          }
        });
      }}
    >
      <select name="type" className="h-10 rounded-md border border-border px-2 text-sm">
        {EXPENSE_TYPES.map((t) => <option key={t}>{t}</option>)}
      </select>
      <Input name="amount" type="number" min={0.01} step="0.01" placeholder="Amount" required />
      <Input name="notes" placeholder="Notes" className="col-span-2" />
      <Button type="submit" size="sm" disabled={pending} className="col-span-2">Add expense</Button>
    </form>
  );
}
