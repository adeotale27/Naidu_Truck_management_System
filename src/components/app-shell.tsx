"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  FileText,
  Users,
  Wallet,
  BarChart3,
  Settings,
  Route,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/server/actions/auth";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trips", label: "Trips", icon: Route },
  { href: "/consignments", label: "Lorry receipts", icon: FileText },
  { href: "/parties", label: "Parties", icon: Users },
  { href: "/fleet", label: "Fleet", icon: Truck },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; role: string };
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-display">
            TL
          </div>
          <div>
            <p className="font-display text-lg leading-none">TruckLedger</p>
            <p className="text-[11px] text-muted-foreground">Naidu Transport</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <form action={logout} className="border-t border-border p-3">
          <div className="mb-2 px-2">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.role.replace("_", " ")}</p>
          </div>
          <button
            type="submit"
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </aside>
      <div className="md:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur md:px-8">
          <p className="text-sm text-muted-foreground">Nagpur · Hinganghat · Wadi · Ctrl/⌘ K to search</p>
          <div className="flex gap-2">
            <Link
              href="/trips/new"
              className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              New trip
            </Link>
            <Link
              href="/consignments/new"
              className="inline-flex h-9 items-center rounded-md bg-accent px-3 text-sm font-medium text-white"
            >
              New consignment
            </Link>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
