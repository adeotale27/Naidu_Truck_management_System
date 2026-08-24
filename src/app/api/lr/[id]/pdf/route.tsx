import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { LrDocument } from "@/lib/lr-pdf";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = await prisma.consignment.findUnique({
    where: { id: params.id },
    include: { consignor: true, consignee: true, trip: { include: { truck: true, driver: true } } },
  });
  const company = await prisma.companySettings.findUnique({ where: { id: "default" } });
  if (!c || !company) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const buf = await renderToBuffer(
      <LrDocument
        d={{
          company: {
            name: company.name,
            address: company.address,
            phone: company.phone,
            gstin: company.gstin,
            lrDisclaimer: company.lrDisclaimer,
          },
          lrNumber: c.lrNumber,
          bookedAt: c.bookedAt,
          consignor: { name: c.consignor.name, city: c.consignor.city, phone: c.consignor.phone },
          consignee: { name: c.consignee.name, city: c.consignee.city, phone: c.consignee.phone },
          origin: c.origin,
          destination: c.destination,
          truckReg: c.trip.truck.registrationNo,
          driverName: c.trip.driver.name,
          goodsDescription: c.goodsDescription,
          packageCount: c.packageCount,
          weightKg: c.weightKg,
          declaredValue: c.declaredValue,
          freightAmount: c.freightAmount,
          paymentType: c.paymentType,
          freightPaidAmount: c.freightPaidAmount,
          balanceDue: c.balanceDue,
        }}
      />,
    );
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${c.lrNumber}.pdf"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
