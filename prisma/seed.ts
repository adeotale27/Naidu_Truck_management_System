import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

async function nextNumber(kind: "LR" | "TRIP", year: number) {
  const seq = await prisma.numberSequence.upsert({
    where: { kind_year: { kind, year } },
    create: { kind, year, current: 1 },
    update: { current: { increment: 1 } },
  });
  return `${kind}-${year}-${String(seq.current).padStart(5, "0")}`;
}

async function main() {
  await prisma.payment.deleteMany();
  await prisma.pOD.deleteMany();
  await prisma.consignmentItem.deleteMany();
  await prisma.consignment.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.party.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.truck.deleteMany();
  await prisma.route.deleteMany();
  await prisma.user.deleteMany();
  await prisma.numberSequence.deleteMany();
  await prisma.companySettings.deleteMany();

  const ownerPin = await bcrypt.hash("1234", 10);
  const clerkPin = await bcrypt.hash("2222", 10);
  const driverPin = await bcrypt.hash("3333", 10);

  const owner = await prisma.user.create({
    data: { name: "Naidu Owner", pinHash: ownerPin, role: "OWNER", active: true },
  });
  await prisma.user.create({
    data: { name: "Booking Clerk", pinHash: clerkPin, role: "BOOKING_CLERK", active: true },
  });
  await prisma.user.create({
    data: { name: "Ramesh Driver", pinHash: driverPin, role: "DRIVER", active: true },
  });

  await prisma.companySettings.create({
    data: {
      id: "default",
      name: "Naidu Goods Transport",
      address: "Wadi Road, Nagpur, Maharashtra 440023",
      phone: "0712-2550100",
      gstin: "27AABCN1234A1Z5",
      email: "office@naidutransport.local",
      lrDisclaimer:
        "Goods booked at owner's risk. The company is not responsible for leakage, breakage, or damage unless caused by proved negligence. Subject to Nagpur jurisdiction. This lorry receipt is issued subject to the terms of the Carriage by Road Act.",
    },
  });

  const trucks = await Promise.all(
    [
      { registrationNo: "MH-31-AB-1201", type: "HCV", capacityTons: 16, ownership: "OWNED", status: "IDLE" },
      { registrationNo: "MH-31-AB-1202", type: "HCV", capacityTons: 16, ownership: "OWNED", status: "ON_ROAD" },
      { registrationNo: "MH-31-CD-3344", type: "LCV", capacityTons: 7.5, ownership: "OWNED", status: "IDLE" },
      { registrationNo: "MH-40-EF-7788", type: "HCV", capacityTons: 19, ownership: "HIRED", status: "MAINTENANCE" },
      { registrationNo: "MH-31-GH-9911", type: "LCV", capacityTons: 9, ownership: "OWNED", status: "INACTIVE" },
    ].map((t, i) => {
      const now = new Date();
      const days = [80, 12, -5, 45, 200][i];
      const expiry = new Date(now);
      expiry.setDate(now.getDate() + days);
      return prisma.truck.create({
        data: {
          ...t,
          insuranceExpiry: expiry,
          permitExpiry: new Date(expiry.getTime() + 10 * 86400000),
          pucExpiry: new Date(expiry.getTime() - 3 * 86400000),
          fitnessExpiry: new Date(expiry.getTime() + 40 * 86400000),
          active: t.status !== "INACTIVE",
        },
      });
    }),
  );

  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        name: "Ramesh Patil",
        phone: "9876500001",
        licenseNo: "MH31-2018-001122",
        licenseExpiry: new Date("2027-06-15"),
        active: true,
      },
    }),
    prisma.driver.create({
      data: {
        name: "Suresh Bhoyar",
        phone: "9876500002",
        licenseNo: "MH40-2019-445566",
        licenseExpiry: new Date("2026-09-01"),
        active: true,
      },
    }),
    prisma.driver.create({
      data: {
        name: "Avinash Kamble",
        phone: "9876500003",
        licenseNo: "MH31-2020-778899",
        licenseExpiry: new Date("2026-02-10"),
        active: true,
      },
    }),
  ]);

  const nagpurHing = await prisma.route.create({
    data: {
      name: "Nagpur ↔ Hinganghat",
      origin: "Nagpur",
      destination: "Hinganghat",
      distanceKm: 82,
      standardFreight: 450,
    },
  });
  const hingNagpur = await prisma.route.create({
    data: {
      name: "Hinganghat ↔ Nagpur",
      origin: "Hinganghat",
      destination: "Nagpur",
      distanceKm: 82,
      standardFreight: 450,
    },
  });
  const wadiHing = await prisma.route.create({
    data: {
      name: "Wadi ↔ Hinganghat",
      origin: "Wadi",
      destination: "Hinganghat",
      distanceKm: 70,
      standardFreight: 400,
    },
  });
  const hingWadi = await prisma.route.create({
    data: {
      name: "Hinganghat ↔ Wadi",
      origin: "Hinganghat",
      destination: "Wadi",
      distanceKm: 70,
      standardFreight: 400,
    },
  });

  const partyNames = [
    ["Shree Steel Traders", "Nagpur", "9876511001", "27AADCS1111A1Z1"],
    ["Hinganghat Kirana Mart", "Hinganghat", "9876511002", null],
    ["Wadi Agro Depot", "Wadi", "9876511003", "27AAACW2222B1Z8"],
    ["Patil Hardware", "Hinganghat", "9876511004", null],
    ["Naidu Textiles", "Nagpur", "9876511005", "27AABCN3333C1Z2"],
    ["Gupta Cement Agency", "Nagpur", "9876511006", "27AAGCG4444D1Z3"],
    ["Deshmukh Furniture", "Hinganghat", "9876511007", null],
    ["Kothari Oil Mill", "Wadi", "9876511008", "27AAACK5555E1Z4"],
    ["City Medical Stores", "Nagpur", "9876511009", null],
    ["Hinganghat Super Bazaar", "Hinganghat", "9876511010", "27AAACH6666F1Z5"],
    ["Wadi Grain Traders", "Wadi", "9876511011", null],
    ["Mahalaxmi Pipes", "Nagpur", "9876511012", "27AAACM7777G1Z6"],
    ["Sai Electricals", "Hinganghat", "9876511013", null],
    ["Orange City Plastics", "Nagpur", "9876511014", "27AAACO8888H1Z7"],
    ["Jai Bhawani Transport Party", "Wadi", "9876511015", null],
  ] as const;

  const parties = await Promise.all(
    partyNames.map(([name, city, phone, gstin]) =>
      prisma.party.create({
        data: {
          name,
          city,
          phone,
          gstin,
          address: `${city} Main Market`,
          partyType: "BOTH",
        },
      }),
    ),
  );

  const year = new Date().getFullYear();
  await prisma.numberSequence.create({ data: { kind: "TRIP", year, current: 0 } });
  await prisma.numberSequence.create({ data: { kind: "LR", year, current: 0 } });

  const today = new Date();
  today.setHours(8, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const trip1No = await nextNumber("TRIP", year);
  const trip2No = await nextNumber("TRIP", year);
  const trip3No = await nextNumber("TRIP", year);

  const trip1 = await prisma.trip.create({
    data: {
      tripNumber: trip1No,
      truckId: trucks[1].id,
      driverId: drivers[0].id,
      routeId: nagpurHing.id,
      direction: "OUTBOUND",
      tripDate: today,
      status: "IN_TRANSIT",
      startOdometer: 120450,
      notes: "Morning load towards Hinganghat",
      createdById: owner.id,
    },
  });

  const trip2 = await prisma.trip.create({
    data: {
      tripNumber: trip2No,
      truckId: trucks[0].id,
      driverId: drivers[1].id,
      routeId: wadiHing.id,
      direction: "OUTBOUND",
      tripDate: today,
      status: "LOADING",
      startOdometer: 88420,
      notes: "Wadi market pickup",
      createdById: owner.id,
    },
  });

  const trip3 = await prisma.trip.create({
    data: {
      tripNumber: trip3No,
      truckId: trucks[2].id,
      driverId: drivers[2].id,
      routeId: hingNagpur.id,
      direction: "RETURN",
      tripDate: yesterday,
      status: "ARRIVED",
      startOdometer: 44110,
      endOdometer: 44195,
      notes: "Return from Hinganghat",
      createdById: owner.id,
    },
  });

  const goods = [
    "MS Pipes",
    "Cement bags",
    "Kirana cartons",
    "Furniture (disassembled)",
    "Fertilizer bags",
    "Electrical goods",
    "Plastic crates",
    "Oil tins",
    "Hardware boxes",
    "Textile bales",
  ];

  async function book(
    tripId: string,
    origin: string,
    destination: string,
    consignor: (typeof parties)[number],
    consignee: (typeof parties)[number],
    paymentType: "PAID" | "TO_PAY" | "FOC",
    freight: number,
    status: string,
  ) {
    const freightAmount = round2(freight);
    const freightPaidAmount = paymentType === "PAID" ? freightAmount : 0;
    const balanceDue = paymentType === "TO_PAY" ? freightAmount : 0;
    const lrNumber = await nextNumber("LR", year);
    const pkg = 5 + Math.floor(Math.random() * 20);
    const desc = goods[Math.floor(Math.random() * goods.length)];
    const c = await prisma.consignment.create({
      data: {
        lrNumber,
        tripId,
        consignorId: consignor.id,
        consigneeId: consignee.id,
        origin,
        destination,
        goodsDescription: desc,
        packageCount: pkg,
        weightKg: pkg * 18,
        declaredValue: freightAmount * 20,
        freightAmount,
        paymentType,
        freightPaidAmount,
        balanceDue,
        status,
      },
    });
    await prisma.consignmentItem.create({
      data: {
        consignmentId: c.id,
        description: desc,
        packageCount: pkg,
        weightKg: pkg * 18,
        declaredValue: freightAmount * 20,
      },
    });
    return c;
  }

  for (let i = 0; i < 10; i++) {
    const type = i % 4 === 0 ? "TO_PAY" : i === 7 ? "FOC" : "PAID";
    const status = i < 8 ? "IN_TRANSIT" : "LOADED";
    await book(trip1.id, "Nagpur", "Hinganghat", parties[i % 6], parties[6 + (i % 5)], type, 350 + i * 40, status);
  }

  for (let i = 0; i < 10; i++) {
    const type = i % 3 === 0 ? "TO_PAY" : "PAID";
    await book(trip2.id, "Wadi", "Hinganghat", parties[8 + (i % 4)], parties[3 + (i % 4)], type, 300 + i * 25, "BOOKED");
  }

  for (let i = 0; i < 10; i++) {
    const type = i % 2 === 0 ? "PAID" : "TO_PAY";
    const status = i < 8 ? "DELIVERED" : "RETURNED_UNDELIVERED";
    const c = await book(
      trip3.id,
      "Hinganghat",
      "Nagpur",
      parties[1 + (i % 5)],
      parties[i % 6],
      type,
      420 + i * 15,
      status,
    );
    if (status === "DELIVERED") {
      await prisma.pOD.create({
        data: {
          consignmentId: c.id,
          receiverName: "Store Incharge",
          receiverPhone: "9876599999",
          deliveredAt: yesterday,
          remarks: "Received in good condition",
        },
      });
    }
  }

  const toPay = await prisma.consignment.findFirst({
    where: { paymentType: "TO_PAY", tripId: trip3.id, status: "DELIVERED" },
  });
  if (toPay) {
    const part = round2(toPay.balanceDue / 2);
    await prisma.payment.create({
      data: {
        partyId: toPay.consigneeId,
        consignmentId: toPay.id,
        amount: part,
        mode: "CASH",
        purpose: "TO_PAY_SETTLEMENT",
        collectorId: owner.id,
        reference: "SEED-CASH-1",
      },
    });
    await prisma.consignment.update({
      where: { id: toPay.id },
      data: {
        freightPaidAmount: round2(toPay.freightPaidAmount + part),
        balanceDue: round2(toPay.balanceDue - part),
      },
    });
  }

  await prisma.expense.createMany({
    data: [
      { tripId: trip1.id, type: "FUEL", amount: 4200, notes: "IOCL Wadi" },
      { tripId: trip1.id, type: "TOLL", amount: 180, notes: "NH44" },
      { tripId: trip1.id, type: "DRIVER_BATTA", amount: 600 },
      { tripId: trip2.id, type: "FUEL", amount: 3100 },
      { tripId: trip2.id, type: "LOADING_UNLOADING", amount: 400 },
      { tripId: trip3.id, type: "FUEL", amount: 2800 },
      { tripId: trip3.id, type: "TOLL", amount: 160 },
      { tripId: trip3.id, type: "OTHER", amount: 120, notes: "Parking" },
    ],
  });

  void hingWadi;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
