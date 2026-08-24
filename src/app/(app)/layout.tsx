import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { CommandPalette } from "@/components/command-palette";
import { redirect } from "next/navigation";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <>
      <AppShell user={session}>{children}</AppShell>
      <CommandPalette />
    </>
  );
}
