import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PartiesPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim();
  const parties = await prisma.party.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { city: { contains: q } }, { phone: { contains: q } }] } : {},
    orderBy: { name: "asc" },
    take: 200,
  });
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Parties</h1>
      <form><input name="q" defaultValue={q} placeholder="Search name, city, phone" className="h-10 w-full max-w-md rounded-md border border-border bg-card px-3 text-sm" /></form>
      <Card>
        <CardHeader><CardTitle>{parties.length} parties</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="px-5 py-2">Name</th><th>City</th><th>Phone</th><th>GSTIN</th></tr></thead>
            <tbody>
              {parties.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-5 py-2"><Link className="text-primary" href={`/parties/${p.id}`}>{p.name}</Link></td>
                  <td>{p.city ?? "—"}</td>
                  <td>{p.phone ?? "—"}</td>
                  <td className="font-mono text-xs">{p.gstin ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
