import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import { Prisma, PrismaClient } from "@prisma/client";
import { app } from "../app";

const prisma = new PrismaClient();

// All test accounts use this domain so cleanup is scoped and safe
const TEST_EMAIL_SUFFIX = "@test.growthtracker.local";
const email = (name: string) => `${name}${TEST_EMAIL_SUFFIX}`;

async function cleanupTestUsers() {
  await prisma.user.deleteMany({
    where: { email: { endsWith: TEST_EMAIL_SUFFIX } },
  });
}

// Tests run against the real dev Postgres database (see vitest.config.ts),
// which may already hold unrelated users (real accounts, leftover manual
// testing, etc). Total-count assertions capture a baseline with the same
// `where` the endpoint would apply *before* seeding test data, so they hold
// regardless of what else is in the table.
async function countWhere(where: Prisma.UserWhereInput = {}): Promise<number> {
  return prisma.user.count({ where });
}

function usersOnPage(total: number, page: number, pageSize = 10): number {
  return Math.max(0, Math.min(pageSize, total - (page - 1) * pageSize));
}

beforeAll(async () => {
  await cleanupTestUsers();
});

afterEach(async () => {
  await cleanupTestUsers();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const basePayload = {
  email: email("users-test-learner"),
  password: "Secret123!",
  role: "LEARNER" as const,
  department: "Engineering",
  experienceLevel: "MID" as const,
  birthdate: "1995-06-15",
};

async function signupAndGetToken(payload = basePayload) {
  const res = await request(app).post("/api/auth/signup").send(payload);
  return res.body.accessToken as string;
}

async function createUsers(count: number) {
  for (let i = 0; i < count; i++) {
    await request(app)
      .post("/api/auth/signup")
      .send({ ...basePayload, email: email(`users-test-page-${i}`) });
  }
}

// A small, deterministic set of users spanning roles, departments, and
// experience levels, used by the filtering and sorting tests.
const diverseUsers = [
  { email: email("users-test-alice"), role: "LEARNER", department: "Engineering", experienceLevel: "JUNIOR" },
  { email: email("users-test-bob"),   role: "LEARNER", department: "Design",      experienceLevel: "MID" },
  {
    email: email("users-test-carol"),
    role: "MANAGER",
    department: "Product",
    experienceLevel: "SENIOR",
    teamName: "Platform Team",
  },
] as const;

async function seedDiverseUsers() {
  for (const u of diverseUsers) {
    await request(app)
      .post("/api/auth/signup")
      .send({ ...basePayload, ...u });
  }
}

describe("GET /api/users", () => {
  it("returns 401 with no token", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });

  it("returns 401 with a malformed token", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", "Bearer not.a.valid.token");
    expect(res.status).toBe(401);
  });

  it("returns the first page of 10 users by default", async () => {
    const baseline = await countWhere();
    const token = await signupAndGetToken();
    await createUsers(11);
    const total = baseline + 12;

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(usersOnPage(total, 1));
    expect(res.body.pagination).toEqual({ page: 1, pageSize: 10, total, totalPages: Math.ceil(total / 10) });
    expect(res.body.users[0].passwordHash).toBeUndefined();
  });

  it("returns the second page with remaining users", async () => {
    const baseline = await countWhere();
    const token = await signupAndGetToken();
    await createUsers(11);
    const total = baseline + 12;

    const res = await request(app)
      .get("/api/users")
      .query({ page: 2 })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(usersOnPage(total, 2));
    expect(res.body.pagination).toEqual({ page: 2, pageSize: 10, total, totalPages: Math.ceil(total / 10) });
  });

  it("returns an empty list for a page beyond the last one", async () => {
    const baseline = await countWhere();
    const token = await signupAndGetToken();
    const total = baseline + 1;

    const res = await request(app)
      .get("/api/users")
      .query({ page: 5 })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(usersOnPage(total, 5));
    expect(res.body.pagination).toEqual({
      page: 5,
      pageSize: 10,
      total,
      totalPages: Math.max(1, Math.ceil(total / 10)),
    });
  });

  it("returns 400 for a non-positive page value", async () => {
    const token = await signupAndGetToken();

    const res = await request(app)
      .get("/api/users")
      .query({ page: 0 })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.errors.page).toBeDefined();
  });

  it("returns 400 for a non-numeric page value", async () => {
    const token = await signupAndGetToken();

    const res = await request(app)
      .get("/api/users")
      .query({ page: "abc" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.errors.page).toBeDefined();
  });

  // ── pageSize ──

  it("honors a custom pageSize", async () => {
    const baseline = await countWhere();
    const token = await signupAndGetToken();
    await createUsers(11);
    const total = baseline + 12;

    const res = await request(app)
      .get("/api/users")
      .query({ pageSize: 5 })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(usersOnPage(total, 1, 5));
    expect(res.body.pagination).toEqual({ page: 1, pageSize: 5, total, totalPages: Math.ceil(total / 5) });
  });

  it("returns 400 for a pageSize below 1", async () => {
    const token = await signupAndGetToken();

    const res = await request(app)
      .get("/api/users")
      .query({ pageSize: 0 })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.errors.pageSize).toBeDefined();
  });

  it("returns 400 for a pageSize above the maximum", async () => {
    const token = await signupAndGetToken();

    const res = await request(app)
      .get("/api/users")
      .query({ pageSize: 101 })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.errors.pageSize).toBeDefined();
  });

  it("returns 400 for a non-numeric pageSize value", async () => {
    const token = await signupAndGetToken();

    const res = await request(app)
      .get("/api/users")
      .query({ pageSize: "abc" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.errors.pageSize).toBeDefined();
  });

  it("echoes the default sort and empty filters", async () => {
    const token = await signupAndGetToken();

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.sort).toEqual({ sortBy: "createdAt", sortOrder: "asc" });
    expect(res.body.filters).toEqual({
      role: null,
      department: null,
      experienceLevel: null,
      search: null,
    });
  });

  // ── Filtering ──

  it("filters by role", async () => {
    const baseline = await countWhere({ role: "MANAGER" });
    const token = await signupAndGetToken();
    await seedDiverseUsers();

    const res = await request(app)
      .get("/api/users")
      .query({ role: "MANAGER" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(baseline + 1); // + Carol
    expect(res.body.users.every((u: { role: string }) => u.role === "MANAGER")).toBe(true);
    expect(res.body.filters.role).toBe("MANAGER");
  });

  it("filters by department", async () => {
    const baseline = await countWhere({ department: "Design" });
    const token = await signupAndGetToken();
    await seedDiverseUsers();

    const res = await request(app)
      .get("/api/users")
      .query({ department: "Design" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(baseline + 1); // + Bob
    expect(res.body.users.every((u: { department: string }) => u.department === "Design")).toBe(true);
  });

  it("filters by experienceLevel", async () => {
    const baseline = await countWhere({ experienceLevel: "SENIOR" });
    const token = await signupAndGetToken();
    await seedDiverseUsers();

    const res = await request(app)
      .get("/api/users")
      .query({ experienceLevel: "SENIOR" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(baseline + 1); // + Carol
    expect(res.body.users.every((u: { experienceLevel: string }) => u.experienceLevel === "SENIOR")).toBe(true);
  });

  it("combines multiple filters", async () => {
    const baseline = await countWhere({ role: "LEARNER", department: "Engineering" });
    const token = await signupAndGetToken();
    await seedDiverseUsers();

    const res = await request(app)
      .get("/api/users")
      .query({ role: "LEARNER", department: "Engineering" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    // + the token-owner (basePayload) and Alice.
    expect(res.body.pagination.total).toBe(baseline + 2);
    expect(
      res.body.users.every(
        (u: { role: string; department: string }) => u.role === "LEARNER" && u.department === "Engineering",
      ),
    ).toBe(true);
  });

  it("searches case-insensitively across email and teamName", async () => {
    const platformBaseline = await countWhere({
      OR: [
        { email: { contains: "platform", mode: "insensitive" } },
        { teamName: { contains: "platform", mode: "insensitive" } },
      ],
    });
    const aliceBaseline = await countWhere({
      OR: [
        { email: { contains: "alice", mode: "insensitive" } },
        { teamName: { contains: "alice", mode: "insensitive" } },
      ],
    });
    const token = await signupAndGetToken();
    await seedDiverseUsers();

    // Matches Carol's teamName "Platform Team".
    const byTeam = await request(app)
      .get("/api/users")
      .query({ search: "PLATFORM" })
      .set("Authorization", `Bearer ${token}`);

    expect(byTeam.status).toBe(200);
    expect(byTeam.body.pagination.total).toBe(platformBaseline + 1);
    expect(byTeam.body.users.some((u: { teamName: string | null }) => u.teamName === "Platform Team")).toBe(true);

    // Matches Alice's email.
    const byEmail = await request(app)
      .get("/api/users")
      .query({ search: "ALICE" })
      .set("Authorization", `Bearer ${token}`);

    expect(byEmail.status).toBe(200);
    expect(byEmail.body.pagination.total).toBe(aliceBaseline + 1);
    expect(byEmail.body.users.some((u: { email: string }) => u.email === email("users-test-alice"))).toBe(true);
  });

  it("returns 400 for an invalid filter enum value", async () => {
    const token = await signupAndGetToken();

    const res = await request(app)
      .get("/api/users")
      .query({ role: "ADMIN" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.errors.role).toBeDefined();
  });

  // ── Sorting ──

  it("sorts by email ascending", async () => {
    const token = await signupAndGetToken();
    await seedDiverseUsers();

    const res = await request(app)
      .get("/api/users")
      .query({ sortBy: "email", sortOrder: "asc" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const emails = res.body.users.map((u: { email: string }) => u.email);
    expect(emails).toEqual([...emails].sort());
    expect(res.body.sort).toEqual({ sortBy: "email", sortOrder: "asc" });
  });

  it("sorts by email descending", async () => {
    const token = await signupAndGetToken();
    await seedDiverseUsers();

    const res = await request(app)
      .get("/api/users")
      .query({ sortBy: "email", sortOrder: "desc" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const emails = res.body.users.map((u: { email: string }) => u.email);
    expect(emails).toEqual([...emails].sort().reverse());
  });

  it("returns 400 for a non-whitelisted sortBy field", async () => {
    const token = await signupAndGetToken();

    const res = await request(app)
      .get("/api/users")
      .query({ sortBy: "passwordHash" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.errors.sortBy).toBeDefined();
  });

  it("returns 400 for an invalid sortOrder", async () => {
    const token = await signupAndGetToken();

    const res = await request(app)
      .get("/api/users")
      .query({ sortOrder: "sideways" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.errors.sortOrder).toBeDefined();
  });
});
