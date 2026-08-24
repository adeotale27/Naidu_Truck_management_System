"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { login } from "@/server/actions/auth";
import { Button } from "./ui/button";
import { Delete } from "lucide-react";

export function PinPad({ users }: { users: { id: string; name: string; role: string }[] }) {
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [pin, setPin] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  function press(d: string) {
    setPin((p) => (p.length >= 8 ? p : p + d));
  }

  function submit() {
    start(async () => {
      const res = await login(userId, pin);
      if (res?.error) {
        toast.error(res.error);
        setPin("");
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="grid gap-2">
        {users.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => setUserId(u.id)}
            className={`cursor-pointer rounded-lg border px-4 py-3 text-left transition-colors duration-200 ${
              userId === u.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted"
            }`}
          >
            <p className="font-medium">{u.name}</p>
            <p className="text-xs text-muted-foreground">{u.role.replace("_", " ")}</p>
          </button>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-muted py-4 text-center font-mono text-2xl tracking-[0.5em]">
        {pin ? "•".repeat(pin.length) : "PIN"}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map((k) => (
          <button
            key={k}
            type="button"
            className="h-14 cursor-pointer rounded-lg border border-border bg-card text-xl font-medium hover:bg-muted"
            onClick={() => {
              if (k === "C") setPin("");
              else if (k === "⌫") setPin((p) => p.slice(0, -1));
              else press(k);
            }}
          >
            {k === "⌫" ? <Delete className="mx-auto h-5 w-5" /> : k}
          </button>
        ))}
      </div>
      <Button className="w-full h-12" disabled={pending || pin.length < 4} onClick={submit}>
        Unlock
      </Button>
    </div>
  );
}
