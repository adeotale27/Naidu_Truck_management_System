import { Prisma } from "@prisma/client";

export async function nextDocumentNumberTx(
  tx: Prisma.TransactionClient,
  kind: "LR" | "TRIP",
) {
  const year = new Date().getFullYear();
  const existing = await tx.numberSequence.findUnique({
    where: { kind_year: { kind, year } },
  });
  if (!existing) {
    await tx.numberSequence.create({ data: { kind, year, current: 1 } });
    return `${kind}-${year}-00001`;
  }
  const seq = await tx.numberSequence.update({
    where: { kind_year: { kind, year } },
    data: { current: { increment: 1 } },
  });
  return `${kind}-${year}-${String(seq.current).padStart(5, "0")}`;
}
