import { formatINR } from "@/lib/utils";

export function Money({ value, className }: { value: number; className?: string }) {
  return <span className={`font-mono tabular-nums ${className ?? ""}`}>{formatINR(value)}</span>;
}
