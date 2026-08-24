# TruckLedger

Local LTL / GTA lorry-receipt system for a small Nagpur transport office (Nagpur ↔ Hinganghat, Wadi ↔ Hinganghat). Runs fully on localhost with SQLite. No cloud services.

## Prerequisites

- Node.js 20+ (tested on 22)
- npm 10+

## Install and run

```bash
npm install
npm run db:setup
npm run dev
```

Open http://localhost:3000

### Default login

| User | Role | PIN |
| --- | --- | --- |
| Naidu Owner | OWNER | `1234` |
| Booking Clerk | BOOKING_CLERK | `2222` |
| Ramesh Driver | DRIVER | `3333` |

Select the user, enter the PIN, Unlock.

## Database

- Engine: SQLite via Prisma
- File: `prisma/dev.db` (`DATABASE_URL=file:./dev.db`)
- Auth secret: `AUTH_SECRET` in `.env`

Reset seed data:

```bash
npm run db:reset
```

## What this app does

Core flow: **Trip → many LRs → loading → transit → delivery / POD → payment → trip P&L**.

- Sequential `TRIP-YYYY-#####` and `LR-YYYY-#####` numbers (transactional)
- Fast booking with Save & add another
- Paid / To-Pay / FOC freight rules
- Trip cannot complete until every open LR is delivered or returned
- Local LR PDF (A5), Excel/PDF reports
- PIN login (hashed), cookie session, owner-only settings

## Project structure

```
prisma/             schema + seed
src/app/(app)/      authenticated pages
src/app/login/      PIN screen
src/app/api/        LR PDF + report exports
src/components/     UI (shell, booking, party picker, POD)
src/lib/            db, auth, money, PDF document
src/server/actions/ mutations
src/middleware.ts   session gate
design-system/      UI/UX Pro Max tokens used for the look
```

## Version control / what was added

This repository started empty (`Naidu_Truck_management_System`). TruckLedger is the first application commit:

- Next.js 14 App Router, TypeScript, Tailwind
- Prisma + SQLite domain model (users, fleet, parties, trips, consignments, POD, payments, expenses)
- Operational UI (not a generic CRUD admin theme): Swiss/minimal logistics desk, Inter + Calistoga, trust blue `#2563EB`, CTA orange `#EA580C`
- UI/UX Pro Max skill used for design system (density 8 dashboard, light mode)

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run db:setup` | generate client, create DB, seed |
| `npm run db:reset` | wipe SQLite and reseed |
| `npm run dev` | Next.js on :3000 |
| `npm run build` | production build |
| `npm run lint` | ESLint |

Keep `.env` local. Do not commit `prisma/dev.db`.
