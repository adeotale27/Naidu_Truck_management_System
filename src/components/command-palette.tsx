"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { globalSearch } from "@/server/actions/search";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();
  const [data, setData] = useState<Awaited<ReturnType<typeof globalSearch>> | null>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    start(async () => setData(await globalSearch(q)));
  }, [q, open]);

  function go(href: string) {
    setOpen(false);
    setQ("");
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden">
        <Input
          autoFocus
          placeholder="Search LR, trip, party, truck…"
          className="border-0 rounded-none h-12 focus-visible:ring-0"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="max-h-80 overflow-auto p-2 text-sm">
          {pending && <p className="px-2 py-3 text-muted-foreground">Searching…</p>}
          {data && (
            <>
              {data.consignments.map((c) => (
                <button key={c.id} className="block w-full cursor-pointer rounded px-2 py-2 text-left hover:bg-muted" onClick={() => go(`/consignments/${c.id}`)}>
                  LR {c.lrNumber} · {c.status}
                </button>
              ))}
              {data.trips.map((t) => (
                <button key={t.id} className="block w-full cursor-pointer rounded px-2 py-2 text-left hover:bg-muted" onClick={() => go(`/trips/${t.id}`)}>
                  Trip {t.tripNumber} · {t.status}
                </button>
              ))}
              {data.parties.map((p) => (
                <button key={p.id} className="block w-full cursor-pointer rounded px-2 py-2 text-left hover:bg-muted" onClick={() => go(`/parties/${p.id}`)}>
                  Party {p.name} {p.city ? `· ${p.city}` : ""}
                </button>
              ))}
              {data.trucks.map((t) => (
                <button key={t.id} className="block w-full cursor-pointer rounded px-2 py-2 text-left hover:bg-muted" onClick={() => go("/fleet")}>
                  Truck {t.registrationNo} · {t.status}
                </button>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
