# House Ledger Software

Full-product home management portal with marketing site, Stripe billing, and 9 portal modules.

## Demo Credentials (seed data)
| Role | Email | Password |
|------|-------|----------|
| Owner | `owner@thehouseledger.com` | `Password123!` |
| Family | `family@thehouseledger.com` | `Password123!` |
| Manager | `manager@thehouseledger.com` | `Password123!` |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start Postgres (uses port 5433 to avoid conflicts)
docker compose up -d

# 3. Run migrations
npm run db:migrate

# 4. Seed demo data
npm run db:seed

# 5. Start the dev server (includes Socket.IO)
npm run dev
```

Open **http://localhost:3000**

## Stripe Setup (for billing)
1. Create a Stripe account at stripe.com
2. Add your test keys to `.env`
3. Create two products with monthly prices in Stripe dashboard
4. Add the price IDs to `.env`
5. Run `stripe listen --forward-to localhost:3000/api/stripe/webhook` for webhook testing

## Key Files
| File | Purpose |
|------|---------|
| `server.ts` | Custom Node.js server with Socket.IO |
| `prisma/schema.prisma` | Full multi-tenant data model (15+ models) |
| `src/lib/tasks.ts` | On-demand recurrence engine |
| `src/lib/flags.ts` | Feature flag system |
| `src/lib/permissions.ts` | Role-based permission matrix |
| `src/middleware.ts` | JWT auth guard + onboarding redirect |
| `src/app/dashboard/` | All 10 portal module pages |
| `src/app/api/` | All API routes (30+) |
