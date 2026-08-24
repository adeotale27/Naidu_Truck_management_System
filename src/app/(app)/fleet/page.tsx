import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, expiryTone } from "@/lib/utils";

function Expiry({ d }: { d: Date | null }) {
  if (!d) return <span>—</span>;
  const t = expiryTone(d);
  const cls = t === "critical" ? "text-red-700" : t === "warn" ? "text-amber-700" : "";
  return <span className={cls}>{formatDate(d)}</span>;
}

export default async function FleetPage() {
  const [trucks, drivers] = await Promise.all([
    prisma.truck.findMany({ orderBy: { registrationNo: "asc" } }),
    prisma.driver.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Fleet</h1>
      <Card>
        <CardHeader><CardTitle>Trucks</CardTitle></CardHeader>
        <CardContent className="overflow-auto p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="px-5 py-2">Regn</th><th>Type</th><th>Cap</th><th>Own</th><th>Status</th><th>Insurance</th><th>Permit</th><th>PUC</th><th>Fitness</th></tr></thead>
            <tbody>
              {trucks.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-5 py-2 font-mono">{t.registrationNo}</td>
                  <td>{t.type}</td>
                  <td>{t.capacityTons} t</td>
                  <td>{t.ownership}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td><Expiry d={t.insuranceExpiry} /></td>
                  <td><Expiry d={t.permitExpiry} /></td>
                  <td><Expiry d={t.pucExpiry} /></td>
                  <td><Expiry d={t.fitnessExpiry} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Drivers</CardTitle></CardHeader>
        <CardContent className="overflow-auto p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="px-5 py-2">Name</th><th>Phone</th><th>Licence</th><th>Expiry</th><th>Active</th></tr></thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="px-5 py-2">{d.name}</td>
                  <td>{d.phone}</td>
                  <td className="font-mono">{d.licenseNo}</td>
                  <td><Expiry d={d.licenseExpiry} /></td>
                  <td>{d.active ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
