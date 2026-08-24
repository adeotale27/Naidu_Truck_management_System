import { prisma } from "@/lib/db";
import { PinPad } from "@/components/pin-pad";

export default async function LoginPage() {
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="font-display text-3xl">TruckLedger</p>
        <p className="mt-1 text-sm text-muted-foreground">Naidu Goods Transport · Nagpur office</p>
        <div className="mt-8">
          <PinPad users={users} />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">Owner PIN for demo: 1234</p>
      </div>
    </div>
  );
}
