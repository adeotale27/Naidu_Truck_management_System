import { prisma } from "@/lib/db";
import { TripForm } from "@/components/trip-form";

export default async function NewTripPage() {
  const [trucks, drivers, routes] = await Promise.all([
    prisma.truck.findMany({ where: { active: true, status: { not: "INACTIVE" } }, orderBy: { registrationNo: "asc" } }),
    prisma.driver.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.route.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-3xl">New trip</h1>
      <TripForm trucks={trucks} drivers={drivers} routes={routes} />
    </div>
  );
}
