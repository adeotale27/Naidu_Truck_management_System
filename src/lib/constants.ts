export const ROLES = ["OWNER", "BOOKING_CLERK", "DRIVER"] as const;
export type Role = (typeof ROLES)[number];

export const TRIP_STATUSES = ["PLANNED", "LOADING", "IN_TRANSIT", "ARRIVED", "COMPLETED", "CANCELLED"] as const;
export const CONSIGNMENT_STATUSES = [
  "BOOKED",
  "LOADED",
  "IN_TRANSIT",
  "DELIVERED",
  "RETURNED_UNDELIVERED",
  "CANCELLED",
] as const;
export const PAYMENT_TYPES = ["PAID", "TO_PAY", "FOC"] as const;
export const PAYMENT_MODES = ["CASH", "UPI", "BANK_TRANSFER", "OTHER"] as const;
export const PAYMENT_PURPOSES = [
  "FREIGHT_COLLECTION",
  "TO_PAY_SETTLEMENT",
  "ADVANCE",
  "PARTY_LEDGER_ADJUSTMENT",
] as const;
export const EXPENSE_TYPES = ["FUEL", "TOLL", "DRIVER_BATTA", "LOADING_UNLOADING", "MAINTENANCE", "OTHER"] as const;

export const tripStatusFlow: Record<string, string[]> = {
  PLANNED: ["LOADING", "CANCELLED"],
  LOADING: ["IN_TRANSIT", "PLANNED", "CANCELLED"],
  IN_TRANSIT: ["ARRIVED", "CANCELLED"],
  ARRIVED: ["COMPLETED", "IN_TRANSIT"],
  COMPLETED: [],
  CANCELLED: [],
};

export const consignmentStatusFlow: Record<string, string[]> = {
  BOOKED: ["LOADED", "CANCELLED"],
  LOADED: ["IN_TRANSIT", "BOOKED", "CANCELLED"],
  IN_TRANSIT: ["DELIVERED", "RETURNED_UNDELIVERED"],
  DELIVERED: [],
  RETURNED_UNDELIVERED: [],
  CANCELLED: [],
};

export function canCompleteTrip(statuses: string[]) {
  if (statuses.length === 0) return true;
  return statuses.every((s) => s === "DELIVERED" || s === "RETURNED_UNDELIVERED" || s === "CANCELLED");
}

export const statusColors: Record<string, string> = {
  BOOKED: "bg-slate-100 text-slate-700 border-slate-200",
  LOADED: "bg-blue-50 text-blue-800 border-blue-200",
  IN_TRANSIT: "bg-amber-50 text-amber-800 border-amber-200",
  DELIVERED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-800 border-red-200",
  RETURNED_UNDELIVERED: "bg-red-50 text-red-800 border-red-200",
  PLANNED: "bg-slate-100 text-slate-700 border-slate-200",
  LOADING: "bg-blue-50 text-blue-800 border-blue-200",
  ARRIVED: "bg-violet-50 text-violet-800 border-violet-200",
  COMPLETED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  PAID: "bg-emerald-50 text-emerald-800 border-emerald-200",
  TO_PAY: "bg-orange-50 text-orange-900 border-orange-200",
  FOC: "bg-slate-100 text-slate-600 border-slate-200",
  ON_ROAD: "bg-amber-50 text-amber-800 border-amber-200",
  IDLE: "bg-emerald-50 text-emerald-800 border-emerald-200",
  MAINTENANCE: "bg-orange-50 text-orange-900 border-orange-200",
  INACTIVE: "bg-slate-100 text-slate-600 border-slate-200",
  ACTIVE: "bg-emerald-50 text-emerald-800 border-emerald-200",
};
