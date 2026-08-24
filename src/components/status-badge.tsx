import { statusColors } from "@/lib/constants";
import { Badge } from "./ui/card";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const label = status.replaceAll("_", " ");
  return <Badge className={cn(statusColors[status] ?? "bg-slate-100 text-slate-700 border-slate-200")}>{label}</Badge>;
}
