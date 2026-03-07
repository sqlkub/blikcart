# 🐴 Blikcart — Premium Saddlery Platform

Full-stack e-commerce platform with custom order configurator for premium leather saddlery.

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/blikcart/blikcart.git
cd blikcart
cp .env.example .env.local
pnpm install

# 2. Start infrastructure
docker compose up -d

# 3. Setup database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 4. Run all apps
pnpm dev
```

## Running Apps

| App | URL | Description |
|-----|-----|-------------|
| Storefront | http://localhost:3000 | Customer-facing Next.js store |
| Admin Panel | http://localhost:3001 | B2B admin & quote management |
| API | http://localhost:4000 | NestJS REST API |
| API Docs | http://localhost:4000/docs | Swagger documentation |
| Prisma Studio | http://localhost:5555 | Database explorer |

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@blikcart.nl | Admin@2026! |
| Wholesale | buyer@equestrian-demo.nl | Wholesale@2026! |

## Project Structure

```
blikcart/
├── apps/
│   ├── web/          # Next.js 14 storefront (port 3000)
│   ├── admin/        # Next.js 14 admin panel (port 3001)
│   └── api/          # NestJS REST API (port 4000)
├── packages/
│   ├── db/           # Prisma schema + seed data
│   ├── types/        # Shared TypeScript types
│   ├── ui/           # Shared UI components
│   └── config/       # Shared configs
├── .github/workflows/ # CI/CD pipelines
├── docker-compose.yml # Local infrastructure
└── .env.example      # Environment variables template
```

## Key Features

- **Configurator**: 9-step product customisation with live price calculation
- **Custom Order Flow**: Draft → Submit → Quote → Approve → In Production
- **B2B/B2C**: Retail and wholesale accounts with different pricing tiers
- **Admin Panel**: Quote management, custom order dashboard, buyer messaging
- **Payments**: Mollie iDEAL + Stripe integration
- **Auth**: JWT with refresh tokens, role-based access

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm workspaces |
| Storefront | Next.js 14, React, Tailwind CSS, Zustand |
| Admin | Next.js 14, React, Tailwind CSS |
| API | NestJS 10, Passport.js, Swagger |
| Database | PostgreSQL 15 (Prisma ORM) |
| Cache | Redis 7 |
| Storage | AWS S3 (LocalStack for dev) |
| Payments | Mollie (iDEAL) + Stripe |
| Email | Resend |
| Infra | Docker, AWS ECS, Vercel |

## API Endpoints

```
POST /v1/auth/login              # Login
POST /v1/auth/register           # Register
GET  /v1/products                # List products
GET  /v1/products/:slug          # Product detail
GET  /v1/products/categories     # Category tree
GET  /v1/configurator/schema/:cat # Get configurator
POST /v1/configurator/drafts     # Create draft
PATCH /v1/configurator/drafts/:id # Update draft
POST /v1/configurator/drafts/:id/submit # Submit draft
POST /v1/quotes/send             # Send quote (admin)
POST /v1/quotes/:id/respond      # Accept/decline quote (buyer)
POST /v1/payments/create/:orderId # Create payment
```

## Environment Variables

See `.env.example` for all required variables.

## Development Commands

```bash
pnpm dev              # Start all apps
pnpm build            # Build all apps
pnpm lint             # Lint all apps
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database
pnpm db:reset         # Reset + re-seed
```

---

Built with ❤️ for the equestrian industry. blikcart.nl
# blikcart
