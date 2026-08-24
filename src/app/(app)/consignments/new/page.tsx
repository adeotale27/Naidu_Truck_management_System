import { prisma } from "@/lib/db";
import { BookingForm } from "@/components/booking-form";

export default async function NewConsignmentPage({ searchParams }: { searchParams: { tripId?: string } }) {
  const trips = await prisma.trip.findMany({
    where: { cancelled: false, status: { notIn: ["COMPLETED", "CANCELLED"] } },
    include: { route: true, truck: true },
    orderBy: { tripDate: "desc" },
    take: 50,
  });
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-3xl">Book lorry receipt</h1>
      <p className="text-sm text-muted-foreground">Save & add another keeps the trip selected for fast counter booking.</p>
      <div className="rounded-xl border border-border bg-card p-5">
        <BookingForm
          defaultTripId={searchParams.tripId}
          trips={trips.map((t) => ({
            id: t.id,
            tripNumber: t.tripNumber,
            label: `${t.route.origin} → ${t.route.destination} · ${t.truck.registrationNo}`,
          }))}
        />
      </div>
    </div>
  );
}
