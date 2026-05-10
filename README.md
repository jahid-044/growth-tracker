# Growth Tracker — Starter Kit

A monorepo starter kit for the Frontend Club. The goal is to incrementally build a **Growth Tracker** application over time. This repo gives you a running foundation: a PostgreSQL database, an Express API with JWT authentication, and a placeholder for the client.

---

## Prerequisites

Make sure the following are installed before you begin:

| Tool | Version | Install |
|---|---|---|
| Node.js | ≥ 18 | https://nodejs.org |
| pnpm | ≥ 8 | `npm i -g pnpm` |
| Docker Desktop | latest | https://www.docker.com/products/docker-desktop |

> Docker Desktop must be **running** before you start the app.

---

## Quick Start

```bash
git clone <repo-url> growth-tracker
cd growth-tracker
pnpm install
pnpm start
```

`pnpm start` will:
1. Seed `packages/server/.env` from `.env.example` (first run only, skipped if file exists)
2. Start the PostgreSQL container via Docker Compose (detached)
3. Wait until Postgres is accepting connections (`wait-on`)
4. Run database migrations (`prisma migrate dev`)
5. Start the client and server in parallel

---

## Workspace Structure

```
growth-tracker/
├── packages/
│   ├── client/        # Frontend (drop your client source here)
│   └── server/        # Express API — TypeScript + Prisma + JWT
├── docker-compose.yml # Postgres service
├── .env.example       # Template for environment variables
└── start.sh           # One-command startup script
```

---

## Available Scripts

Run these from the **repo root** unless noted otherwise.

| Script | What it does |
|---|---|
| `pnpm start` | Full startup: Docker → wait → migrate → dev servers |
| `pnpm dev` | Start client and server in parallel (Docker must already be up) |
| `pnpm build` | Build all packages |
| `pnpm docker:up` | Start the Postgres container only |
| `pnpm docker:down` | Stop and remove containers |
| `pnpm docker:reset` | Stop containers and delete the database volume (resets all data) |
| `pnpm db:migrate` | Run pending Prisma migrations |

### Server-only scripts (run from `packages/server/`)

| Script | What it does |
|---|---|
| `pnpm dev` | Start the API server with hot reload |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm db:migrate` | Create and apply a new Prisma migration |
| `pnpm db:studio` | Open Prisma Studio (visual DB browser) at http://localhost:5555 |
| `pnpm db:generate` | Regenerate the Prisma client after schema changes |

---

## Ports

| Service | URL |
|---|---|
| Client | http://localhost:5173 |
| API server | http://localhost:8000 |
| Swagger UI | http://localhost:8000/api/docs |
| PostgreSQL | `localhost:5432` |

---

## Environment Variables

The server reads its config from `packages/server/.env`. The first run of `start.sh` creates this file automatically from `.env.example`.

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | `postgresql://postgres:postgres@localhost:5432/growth_tracker` |
| `JWT_SECRET` | Secret for signing access tokens | `change-me-access-secret` |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | `change-me-refresh-secret` |
| `PORT` | Port the API server listens on | `8000` |

> **Before deploying**, replace the JWT secrets with long, random strings. You can generate one with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

## API Reference

Base URL: `http://localhost:8000/api`

> **Interactive docs** — the full API is browsable and testable via Swagger UI at **http://localhost:8000/api/docs** (server must be running). The spec lives in `packages/server/src/swagger.ts`.

### Auth endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/signup` | No | Create a new account |
| `POST` | `/auth/login` | No | Sign in to an existing account |
| `POST` | `/auth/logout` | No | Invalidate the current refresh token |
| `POST` | `/auth/refresh` | No (reads cookie) | Exchange refresh token for a new access token |
| `GET` | `/auth/me` | Yes | Return the current user's profile |
| `GET` | `/health` | No | Health check |

#### Protected routes

Pass the access token in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

#### Token behaviour

- **Access token** — valid for 15 minutes. Include in every authenticated request.
- **Refresh token** — valid for 7 days. Stored in an `HttpOnly` cookie and in the database. Use `POST /auth/refresh` to get a new access token without re-logging in. Tokens are rotated on every refresh.

#### Example: Sign up

```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "password": "securepassword",
    "role": "LEARNER",
    "department": "Engineering",
    "experienceLevel": "MID",
    "addresses": []
  }'
```

`role` must be `"LEARNER"` or `"MANAGER"`. When `role` is `"MANAGER"`, `teamName` is also required.

`experienceLevel` must be `"JUNIOR"`, `"MID"`, or `"SENIOR"`.

`addresses` is optional. Each address requires: `label`, `street1`, `city`, `state`, `zipCode`, `country`. `street2` is optional.

Response:
```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "...",
    "email": "you@example.com",
    "role": "LEARNER",
    "department": "Engineering",
    "experienceLevel": "MID",
    "teamName": null,
    "addresses": []
  }
}
```

---

## Database

The schema lives in `packages/server/prisma/schema.prisma`.

### Models

- **User** — email, hashed password, role, department, experience level, optional team name
- **Address** — one-to-many with User; each entry has a user-defined label and full address fields
- **RefreshToken** — tracks issued refresh tokens for revocation

### Enums

- **Role** — `LEARNER` | `MANAGER`
- **ExperienceLevel** — `JUNIOR` | `MID` | `SENIOR`

After changing the schema, run:

```bash
cd packages/server
pnpm db:migrate
```

To explore the database visually:

```bash
cd packages/server
pnpm db:studio
```


---

## Stopping the App

Press `Ctrl+C` to stop the dev servers, then:

```bash
pnpm docker:down        # stop containers
pnpm docker:reset       # stop containers + wipe the database volume
```
