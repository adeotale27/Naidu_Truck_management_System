import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatINR } from "./utils";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: "Helvetica", color: "#1e293b" },
  header: { borderWidth: 1.5, borderColor: "#1e3a8a", padding: 10, marginBottom: 8 },
  company: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#1e3a8a" },
  title: { fontSize: 12, textAlign: "right", fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row", gap: 8, marginBottom: 8 },
  box: { flex: 1, borderWidth: 1, borderColor: "#cbd5e1", padding: 8, minHeight: 70 },
  label: { fontSize: 8, color: "#64748b", marginBottom: 3, fontFamily: "Helvetica-Bold" },
  tableHeader: { flexDirection: "row", backgroundColor: "#1e3a8a", color: "#fff", padding: 5 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e2e8f0", padding: 5 },
  col: { flex: 1 },
  freight: { marginTop: 10, borderWidth: 1, padding: 8, borderColor: "#ea580c" },
  footer: { marginTop: 16, flexDirection: "row", justifyContent: "space-between" },
  sign: { width: 180, borderTopWidth: 1, borderColor: "#94a3b8", paddingTop: 4, textAlign: "center" },
});

export type LrPdfData = {
  company: { name: string; address: string; phone: string; gstin: string | null; lrDisclaimer: string | null };
  lrNumber: string;
  bookedAt: Date;
  consignor: { name: string; city: string | null; phone: string | null };
  consignee: { name: string; city: string | null; phone: string | null };
  origin: string;
  destination: string;
  truckReg: string;
  driverName: string;
  goodsDescription: string;
  packageCount: number;
  weightKg: number | null;
  declaredValue: number | null;
  freightAmount: number;
  paymentType: string;
  freightPaidAmount: number;
  balanceDue: number;
};

export function LrDocument({ d }: { d: LrPdfData }) {
  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text style={styles.company}>{d.company.name}</Text>
              <Text>{d.company.address}</Text>
              <Text>Phone: {d.company.phone}{d.company.gstin ? `  GSTIN: ${d.company.gstin}` : ""}</Text>
            </View>
            <View>
              <Text style={styles.title}>LORRY RECEIPT</Text>
              <Text>LR No. {d.lrNumber}</Text>
              <Text>
                Date {d.bookedAt.toLocaleDateString("en-IN")}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.box}>
            <Text style={styles.label}>CONSIGNOR</Text>
            <Text>{d.consignor.name}</Text>
            <Text>{d.consignor.city}</Text>
            <Text>{d.consignor.phone}</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.label}>CONSIGNEE</Text>
            <Text>{d.consignee.name}</Text>
            <Text>{d.consignee.city}</Text>
            <Text>{d.consignee.phone}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.box}>
            <Text style={styles.label}>FROM</Text>
            <Text>{d.origin}</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.label}>TO</Text>
            <Text>{d.destination}</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.label}>TRUCK / DRIVER</Text>
            <Text>{d.truckReg}</Text>
            <Text>{d.driverName}</Text>
          </View>
        </View>
        <View style={styles.tableHeader}>
          <Text style={{ flex: 3 }}>Description</Text>
          <Text style={styles.col}>Pkgs</Text>
          <Text style={styles.col}>Weight</Text>
          <Text style={styles.col}>Value</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={{ flex: 3 }}>{d.goodsDescription}</Text>
          <Text style={styles.col}>{d.packageCount}</Text>
          <Text style={styles.col}>{d.weightKg ?? "-"}</Text>
          <Text style={styles.col}>{d.declaredValue != null ? formatINR(d.declaredValue) : "-"}</Text>
        </View>
        <View style={styles.freight}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11 }}>
            Freight {formatINR(d.freightAmount)} · {d.paymentType.replace("_", " ")} · Paid {formatINR(d.freightPaidAmount)} · Balance {formatINR(d.balanceDue)}
          </Text>
          {d.paymentType === "TO_PAY" ? <Text>TO-PAY — collect from consignee before delivery.</Text> : null}
        </View>
        <Text style={{ marginTop: 10, fontSize: 7, color: "#64748b" }}>{d.company.lrDisclaimer}</Text>
        <View style={styles.footer}>
          <Text style={styles.sign}>Consignor signature</Text>
          <Text style={styles.sign}>For {d.company.name}</Text>
        </View>
      </Page>
    </Document>
  );
}
