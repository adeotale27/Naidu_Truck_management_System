import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsForms } from "@/components/settings-forms";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || session.role !== "OWNER") redirect("/");
  const [company, routes, users] = await Promise.all([
    prisma.companySettings.findUnique({ where: { id: "default" } }),
    prisma.route.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Settings</h1>
      <SettingsForms company={company} routes={routes} users={users} />
    </div>
  );
}
