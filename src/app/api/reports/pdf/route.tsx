import { NextResponse } from "next/server";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatINR } from "@/lib/utils";

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, fontFamily: "Helvetica" },
  h: { fontSize: 16, marginBottom: 12 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, paddingVertical: 4 },
  c: { flex: 1 },
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const trips = await prisma.trip.findMany({
    include: { truck: true, route: true, consignments: true, expenses: true },
    orderBy: { tripDate: "desc" },
    take: 50,
  });
  const buf = await renderToBuffer(
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h}>TruckLedger trip P&amp;L</Text>
        {trips.map((t) => {
          const collected = t.consignments.reduce((s, c) => s + c.freightPaidAmount, 0);
          const exp = t.expenses.reduce((s, e) => s + e.amount, 0);
          return (
            <View key={t.id} style={styles.row}>
              <Text style={styles.c}>{t.tripNumber}</Text>
              <Text style={styles.c}>{t.truck.registrationNo}</Text>
              <Text style={styles.c}>{formatINR(collected)}</Text>
              <Text style={styles.c}>{formatINR(exp)}</Text>
              <Text style={styles.c}>{formatINR(collected - exp)}</Text>
            </View>
          );
        })}
      </Page>
    </Document>,
  );
  return new NextResponse(new Uint8Array(buf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline; filename=truckledger-report.pdf" },
  });
}
