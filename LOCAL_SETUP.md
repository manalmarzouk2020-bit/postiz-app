# Running AI Sales Brain locally

This covers running Postiz + the AI Sales Brain module on your own machine
(not the sandbox this was built in). On a normal machine with Docker
installed, this is much simpler than the workarounds needed inside the
build sandbox.

## 1. Prerequisites

- Node.js 22.x and pnpm (`corepack enable` or `npm i -g pnpm`)
- Docker + Docker Compose

## 2. Start the supporting services

```bash
docker compose -f docker-compose.dev.yaml up -d
```

This starts Postgres, Redis, and a full local Temporal cluster (with UI on
`:8080`). First run pulls several images and can take a few minutes.

## 3. Configure environment

```bash
cp .env.example .env
```

Fill in at minimum:

- `DATABASE_URL="postgresql://postiz-user:postiz-password@localhost:5432/postiz-db-local"`
  (matches the credentials in `docker-compose.dev.yaml`)
- `REDIS_URL="redis://localhost:6379"`
- `JWT_SECRET` — any long random string (`openssl rand -hex 32`)
- `FRONTEND_URL="http://localhost:4200"`, `NEXT_PUBLIC_BACKEND_URL="http://localhost:3000"`,
  `BACKEND_INTERNAL_URL="http://localhost:3000"`
- `STORAGE_PROVIDER="local"` (skips needing Cloudflare R2 for local testing)
- **`OPENAI_API_KEY`** — a real key from platform.openai.com. Without this,
  everything in Sales Brain works except the actual AI replies (decision
  engine, playbook, coaching, roleplay, insights all call OpenAI and will
  error without a valid key).
- Leave `STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` empty for local
  testing — this disables billing/plan gating entirely.

## 4. Install dependencies and set up the database

```bash
pnpm install
pnpm run prisma-db-push
```

## 5. Run it

```bash
pnpm run dev
```

This starts backend (`:3000`), frontend (`:4200`), and the extension build
together. Open **http://localhost:4200**, register an account (this becomes
your organization), and go to **Sales Brain** in the left sidebar.

## 6. First things to do inside Sales Brain

1. **Products & Offers** → add what you actually sell (name, price, features,
   benefits, guarantees). The AI only ever talks about what's entered here.
2. **Settings** → pick an AI autonomy level (start with "Assisted" so you
   approve every reply before it's considered sent) and optionally set a
   custom assistant name (white-label).
3. **Leads** → add a lead manually and open it to send a test message as
   that lead, to see the AI's diagnosis and reply.
4. **Playbook** → generate once you have at least one product.

## Known local-only limitation

If you ever run this inside a network-restricted sandbox (like the one used
to build this), outbound calls to `api.openai.com` may be blocked by that
sandbox's own egress policy — that's a sandbox restriction, not a bug in the
code. On a normal machine or server this does not apply.
