import { z } from "zod";

const money = z.coerce.number().min(0, "Amount cannot be negative");
const positiveInt = z.coerce.number().int().min(1);

export const loginSchema = z.object({
  userId: z.string().min(1),
  pin: z.string().min(4).max(8).regex(/^\d+$/, "PIN must be numeric"),
});

export const partySchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  partyType: z.enum(["CONSIGNOR", "CONSIGNEE", "BOTH"]).default("BOTH"),
  notes: z.string().optional().nullable(),
});

export const truckSchema = z.object({
  registrationNo: z.string().min(4),
  type: z.enum(["LCV", "HCV", "TRAILER", "OTHER"]),
  capacityTons: z.coerce.number().positive(),
  ownership: z.enum(["OWNED", "HIRED"]),
  status: z.enum(["ACTIVE", "ON_ROAD", "IDLE", "MAINTENANCE", "INACTIVE"]),
  insuranceExpiry: z.string().optional().nullable(),
  permitExpiry: z.string().optional().nullable(),
  pucExpiry: z.string().optional().nullable(),
  fitnessExpiry: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const driverSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  licenseNo: z.string().min(4),
  licenseExpiry: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  active: z.coerce.boolean().optional(),
});

export const routeSchema = z.object({
  name: z.string().min(2),
  origin: z.string().min(2),
  destination: z.string().min(2),
  distanceKm: z.coerce.number().min(0).optional().nullable(),
  standardFreight: money.optional().nullable(),
});

export const tripSchema = z.object({
  truckId: z.string().min(1),
  driverId: z.string().min(1),
  routeId: z.string().min(1),
  direction: z.enum(["OUTBOUND", "RETURN"]),
  tripDate: z.string().min(1),
  departureAt: z.string().optional().nullable(),
  startOdometer: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const consignmentSchema = z.object({
  tripId: z.string().min(1),
  consignorId: z.string().min(1),
  consigneeId: z.string().min(1),
  goodsDescription: z.string().min(2),
  packageCount: positiveInt,
  weightKg: z.coerce.number().min(0).optional().nullable(),
  declaredValue: money.optional().nullable(),
  freightAmount: money,
  paymentType: z.enum(["PAID", "TO_PAY", "FOC"]),
  remarks: z.string().optional().nullable(),
});

export const paymentSchema = z.object({
  partyId: z.string().min(1),
  consignmentId: z.string().optional().nullable(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  mode: z.enum(["CASH", "UPI", "BANK_TRANSFER", "OTHER"]),
  purpose: z.enum(["FREIGHT_COLLECTION", "TO_PAY_SETTLEMENT", "ADVANCE", "PARTY_LEDGER_ADJUSTMENT"]),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  collectedAt: z.string().optional().nullable(),
});

export const expenseSchema = z.object({
  tripId: z.string().min(1),
  type: z.enum(["FUEL", "TOLL", "DRIVER_BATTA", "LOADING_UNLOADING", "MAINTENANCE", "OTHER"]),
  amount: z.coerce.number().positive(),
  date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const podSchema = z.object({
  consignmentId: z.string().min(1),
  receiverName: z.string().min(2),
  receiverPhone: z.string().optional().nullable(),
  deliveredAt: z.string().min(1),
  remarks: z.string().optional().nullable(),
});

export const userSchema = z.object({
  name: z.string().min(2),
  role: z.enum(["OWNER", "BOOKING_CLERK", "DRIVER"]),
  pin: z.string().min(4).max(8).regex(/^\d+$/),
});

export const companySchema = z.object({
  name: z.string().min(2),
  address: z.string().min(4),
  phone: z.string().min(8),
  gstin: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  lrDisclaimer: z.string().optional().nullable(),
});
