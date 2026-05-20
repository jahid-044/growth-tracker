# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Growth Tracker is a monorepo starter kit for building a learning and growth management application. It contains:
- A pnpm monorepo with two main packages: client (React 19) and server (Express + TypeScript)
- PostgreSQL database managed via Prisma ORM
- JWT-based authentication with refresh token rotation
- Swagger API documentation
- Full authentication scaffolding (signup, login, logout, refresh, profile endpoints)

## Monorepo Structure

```
growth-tracker/
├── packages/
│   ├── client/              # React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui
│   │   ├── src/
│   │   │   ├── pages/       # Home, Login, Signup (placeholder implementations)
│   │   │   ├── components/  # UI components (shadcn-based)
│   │   │   ├── lib/         # Utilities (e.g. cn() for class merging)
│   │   │   ├── types/       # TypeScript types
│   │   │   ├── App.tsx      # React Router setup
│   │   │   └── main.tsx     # Entry point
│   │   ├── vite.config.ts   # Vite + Tailwind v4 + React Compiler + Babel
│   │   ├── vitest.config.ts # Unit test config (jsdom environment)
│   │   ├── tsconfig.json    # Path aliases: @/* → src/*
│   │   └── eslint.config.js # Flat ESLint config (TypeScript + React Hooks + React Refresh)
│   │
│   ├── server/              # Express + TypeScript + Prisma + JWT
│   │   ├── src/
│   │   │   ├── controllers/ # auth.ts handles signup, login, logout, refresh, me, checkEmail
│   │   │   ├── routes/      # Express route definitions
│   │   │   ├── middleware/  # requireAuth.ts - JWT verification
│   │   │   ├── types/       # address.ts and other types
│   │   │   ├── app.ts       # Express app setup (CORS, middlewares, routes)
│   │   │   ├── config.ts    # Environment variable validation with Zod
│   │   │   ├── index.ts     # Server entrypoint
│   │   │   └── swagger.ts   # OpenAPI 3.0 spec for API docs
│   │   ├── prisma/
│   │   │   ├── schema.prisma # Database schema (User, Address, RefreshToken models)
│   │   │   └── migrations/  # Auto-generated Prisma migrations
│   │   ├── tsconfig.json    # CommonJS, ES2020 target
│   │   └── package.json
│   │
│   └── docs/                # Learning guides (signup-form.md)
│
├── docker-compose.yml       # PostgreSQL 16 service
├── pnpm-workspace.yaml      # Monorepo config + Prisma build allowlist
├── package.json             # Root-level scripts
├── .env.example             # Environment template for server
└── start.sh                 # One-command startup script
```

## Key Technologies

**Client Stack:**
- React 19 with React Compiler (via babel-plugin-react-compiler)
- TypeScript ~6.0
- Vite 8.0 (dev server and build)
- Tailwind CSS v4 (via @tailwindcss/vite plugin)
- shadcn/ui (component library, configured in components.json)
- React Router v7 (BrowserRouter wrapping entire app)
- Vitest + @testing-library/react (unit tests)
- ESLint (flat config with TypeScript, React Hooks, React Refresh)

**Server Stack:**
- Express.js (HTTP API)
- TypeScript 5.4
- Prisma 5.14 (ORM + migrations)
- PostgreSQL 16 (Docker)
- JWT (jsonwebtoken) - access tokens (15m) + refresh tokens (7d, rotated)
- bcryptjs (password hashing, 10 salt rounds)
- Zod (request validation)
- Swagger/OpenAPI (auto-generated API docs)
- ts-node-dev (hot-reload dev server)
- Vitest (unit tests with supertest)

## Core Architecture

### Authentication Flow

1. Signup (POST /api/auth/signup):
   - Validates input with Zod schema (email, password >=8 chars, role, department, experienceLevel, birthdate, optional teamName+bio+addresses)
   - MANAGER role requires teamName
   - Password hashed with bcryptjs (10 rounds)
   - User + Address records created in one transaction
   - Issues access + refresh tokens, stores refresh token in DB + httpOnly cookie

2. Login (POST /api/auth/login):
   - Validates email + password with Zod
   - Compares password hash with bcrypt.compare()
   - Issues new tokens, stores refresh token

3. Refresh (POST /api/auth/refresh):
   - Reads refresh token from httpOnly cookie
   - Verifies JWT signature and DB existence
   - Rotates token: deletes old token, issues new one
   - Returns new access token

4. Logout (POST /api/auth/logout):
   - Deletes refresh token from DB
   - Clears cookie

5. Protected Routes (e.g., GET /api/auth/me):
   - requireAuth middleware extracts Bearer token from Authorization header
   - Verifies JWT signature with access token secret
   - Attaches req.user (sub + email) for downstream handlers

### Database Schema

Enums:
- Role: LEARNER | MANAGER
- ExperienceLevel: JUNIOR | MID | SENIOR
- Department: Engineering | Product | Design | Marketing | Operations | HR | Other

Models:
- User: id (cuid), email (unique), passwordHash, role, department, experienceLevel, teamName (nullable), bio (nullable), birthdate, createdAt, relations (tokens, addresses)
- Address: id, userId, label, street1, street2 (nullable), city, zipCode, createdAt
- RefreshToken: id, token (unique), userId, expiresAt, createdAt

Constraints: User.email is unique; Address.userId and RefreshToken.userId have CASCADE delete

### Environment Configuration

Server reads from packages/server/.env via dotenv. Validated at startup with Zod schema:
- DATABASE_URL: PostgreSQL connection string (default: postgresql://postgres:postgres@localhost:5432/growth_tracker)
- JWT_SECRET: Access token secret (MUST be long/random in production)
- JWT_REFRESH_SECRET: Refresh token secret (MUST be long/random in production)
- PORT: Server port (default 8000)

Generate secure secrets: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

## Commands

### Root-Level (pnpm workspace)

| Command | Purpose |
|---------|---------|
| pnpm install | Install all dependencies across packages |
| pnpm start | Full startup: Docker → wait → migrations → dev servers |
| pnpm dev | Start client + server in parallel (Docker must be running) |
| pnpm build | Build all packages (client: tsc + vite; server: tsc) |
| pnpm docker:up | Start PostgreSQL container |
| pnpm docker:down | Stop and remove containers |
| pnpm docker:reset | Stop containers and wipe database volume |
| pnpm db:migrate | Run pending Prisma migrations |

### Client-Specific (in packages/client/)

| Command | Purpose |
|---------|---------|
| pnpm dev | Start Vite dev server (http://localhost:5173) |
| pnpm build | Type-check (tsc -b) + build with Vite |
| pnpm preview | Preview production build |
| pnpm lint | Run ESLint (flat config) |
| pnpm test | Run Vitest once |
| pnpm test:watch | Run Vitest in watch mode |

### Server-Specific (in packages/server/)

| Command | Purpose |
|---------|---------|
| pnpm dev | Start Express server with ts-node-dev (hot reload, http://localhost:8000) |
| pnpm build | Compile TypeScript to dist/ (ES2020, CommonJS) |
| pnpm start | Run compiled dist/index.js |
| pnpm db:migrate | Create/apply Prisma migration |
| pnpm db:generate | Regenerate Prisma client (after schema.prisma changes) |
| pnpm db:studio | Open Prisma Studio (visual DB browser, http://localhost:5555) |
| pnpm test | Run Vitest once |
| pnpm test:watch | Run Vitest in watch mode |

### Running Single Tests

Client: cd packages/client && pnpm test -- src/__tests__/Signup.test.tsx
Server: cd packages/server && pnpm test -- src/__tests__/auth.test.ts

## Service Ports

| Service | URL | Notes |
|---------|-----|-------|
| Client (Vite) | http://localhost:5173 | React app |
| API Server | http://localhost:8000 | Express API |
| Swagger UI | http://localhost:8000/api/docs | Interactive API docs |
| Prisma Studio | http://localhost:5555 | Visual database browser |
| PostgreSQL | localhost:5432 | Internal (Docker) |

## API Reference

Base URL: http://localhost:8000/api

Interactive Docs: Full API browsable via Swagger UI at http://localhost:8000/api/docs (requires server running)

Auth Endpoints:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/signup | No | Register new user |
| POST | /auth/login | No | Sign in |
| POST | /auth/logout | No | Invalidate refresh token |
| POST | /auth/refresh | No (cookie) | Exchange refresh token for access token |
| GET | /auth/me | Yes | Get current user profile |
| GET | /auth/check-email | No | Check if email is available |
| GET | /health | No | Health check |

Protected routes require Authorization: Bearer <accessToken> header.

## Development Workflow

### Adding Features

1. Database schema changes:
   - Edit packages/server/prisma/schema.prisma
   - Run: cd packages/server && pnpm db:migrate
   - Commit migration file

2. Server endpoints:
   - Add handler in src/controllers/ (or existing auth.ts)
   - Add route in src/routes/ (or existing auth.ts)
   - Update Swagger schema in src/swagger.ts
   - Write tests in src/__tests__/

3. Client pages/components:
   - Create page component in src/pages/ or component in src/components/
   - Register route in src/App.tsx (inside <Routes>)
   - Add/update tests in src/__tests__/

4. UI components from shadcn:
   cd packages/client
   npx shadcn@latest add button  # or other component
   Then import with alias: import { Button } from '@/components/ui/button'

### Testing

Both packages use Vitest with TypeScript support:
- Client: jsdom environment (configured in vitest.config.ts)
- Server: Node environment (default)
- Example test locations: src/__tests__/Signup.test.tsx (client), src/__tests__/auth.test.ts (server)

### Build & Deployment

- Client: pnpm build outputs to dist/ (Vite bundle)
- Server: pnpm build outputs to dist/ (TypeScript compiled), run with pnpm start or node dist/index.js
- Database: Prisma handles schema versioning via migrations (committed to git)
- Environment: Create .env from .env.example before deploying; ensure JWT secrets are strong/random

## Important Implementation Notes

1. Zod Validation:
   - Request bodies are validated server-side with Zod schemas in controllers/auth.ts
   - Use .safeParse() and handle errors with .flatten().fieldErrors
   - Address and signup schemas are defined inline; consider extracting to types/schemas.ts if reused

2. Prisma Client Singleton:
   - Currently, new PrismaClient() is instantiated in each controller
   - In production, should instantiate once and share globally (to avoid connection pool exhaustion)
   - Pattern: create lib/prisma.ts exporting singleton instance

3. Token Rotation:
   - Refresh tokens are rotated on every refresh: old token deleted, new one issued
   - Stored in DB for revocation checks; stored in httpOnly cookie for security
   - Access token: 15m TTL; Refresh token: 7d TTL

4. CORS:
   - Currently hardcoded to http://localhost:5173 in app.ts
   - Update to environment variable for deployments

5. React Compiler:
   - Enabled via babel-plugin-react-compiler in vite.config.ts
   - Optimizes React component rendering; requires React 19+

6. Tailwind v4:
   - Uses @tailwindcss/vite plugin (not tailwind.config.js)
   - Configure via src/index.css import and vite.config.ts
   - No tailwind.config.js needed with v4

7. Client Pages Are Placeholders:
   - Home, Login, Signup pages contain only placeholder headings
   - Implement actual forms and integrate with API endpoints

## File Locations Quick Reference

| What | Where |
|------|-------|
| Database schema | packages/server/prisma/schema.prisma |
| Auth logic | packages/server/src/controllers/auth.ts |
| Auth routes | packages/server/src/routes/auth.ts |
| Auth middleware | packages/server/src/middleware/requireAuth.ts |
| API docs spec | packages/server/src/swagger.ts |
| Environment vars | packages/server/.env (from .env.example) |
| Client entry | packages/client/src/main.tsx |
| App routes | packages/client/src/App.tsx |
| Client pages | packages/client/src/pages/ |
| UI components | packages/client/src/components/ui/ |
| Client styles | packages/client/src/index.css |
| Learning guides | packages/docs/signup-form.md |

## Next Steps for Feature Development

The following systems are scaffolded and ready to extend:

1. Add new user fields: Update Prisma schema → migrate → update Swagger schema → test
2. Add new endpoints: Add controller function → add route → update Swagger → test
3. Implement pages: Create page component → add route to App.tsx → wire up API calls
4. Add protected endpoints: Use requireAuth middleware on Express routes
5. Expand addresses: Already modeled as one-to-many; extend Address schema as needed
