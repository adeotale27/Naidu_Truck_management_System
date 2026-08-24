"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createParty, searchParties } from "@/server/actions/parties";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/card";
import type { Party } from "@prisma/client";

export function PartyPicker({
  label,
  name,
  defaultId,
  defaultLabel,
  required,
}: {
  label: string;
  name: string;
  defaultId?: string;
  defaultLabel?: string;
  required?: boolean;
}) {
  const [query, setQuery] = useState(defaultLabel ?? "");
  const [selectedId, setSelectedId] = useState(defaultId ?? "");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Party[]>([]);
  const [creating, setCreating] = useState(false);
  const [pending, start] = useTransition();
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCity, setNewCity] = useState("");

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      start(async () => {
        const rows = await searchParties(query);
        setResults(rows);
      });
    }, 150);
    return () => clearTimeout(t);
  }, [query, open]);

  const shown = useMemo(() => results, [results]);

  return (
    <div className="relative">
      <Label htmlFor={name}>{label}</Label>
      <input type="hidden" name={name} value={selectedId} required={required} />
      <Input
        id={name}
        value={query}
        autoComplete="off"
        placeholder="Search party name, city, phone"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedId("");
          setOpen(true);
        }}
      />
      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg">
          <div className="max-h-56 overflow-auto">
            {pending && <p className="px-3 py-2 text-xs text-muted-foreground">Searching…</p>}
            {!pending && shown.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">No parties found</p>}
            {shown.map((p) => (
              <button
                type="button"
                key={p.id}
                className="flex w-full cursor-pointer flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  setSelectedId(p.id);
                  setQuery(`${p.name}${p.city ? ` · ${p.city}` : ""}`);
                  setOpen(false);
                }}
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-muted-foreground">
                  {[p.city, p.phone].filter(Boolean).join(" · ")}
                </span>
              </button>
            ))}
          </div>
          <div className="border-t border-border p-2">
            {!creating ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(true)}>
                + New party
              </Button>
            ) : (
              <div className="space-y-2">
                <Input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                  <Input placeholder="City" value={newCity} onChange={(e) => setNewCity(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      start(async () => {
                        const res = await createParty({
                          name: newName,
                          phone: newPhone,
                          city: newCity,
                          partyType: "BOTH",
                        });
                        if ("party" in res && res.party) {
                          setSelectedId(res.party.id);
                          setQuery(`${res.party.name}${res.party.city ? ` · ${res.party.city}` : ""}`);
                          setCreating(false);
                          setOpen(false);
                          setNewName("");
                          setNewPhone("");
                          setNewCity("");
                        }
                      });
                    }}
                  >
                    Save party
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
