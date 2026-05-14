import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
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

beforeAll(async () => {
  await cleanupTestUsers();
});

afterEach(async () => {
  await cleanupTestUsers();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const basePayload = {
  email: email("learner"),
  password: "Secret123!",
  role: "LEARNER" as const,
  department: "Engineering",
  experienceLevel: "MID" as const,
  birthdate: "1995-06-15",
};

const managerPayload = {
  email: email("manager"),
  password: "Secret123!",
  role: "MANAGER" as const,
  department: "Product",
  experienceLevel: "SENIOR" as const,
  teamName: "Platform Team",
  birthdate: "1990-03-22",
};

async function signupAndGetToken(payload = basePayload) {
  const res = await request(app).post("/api/auth/signup").send(payload);
  return res.body.accessToken as string;
}

// ── Health ────────────────────────────────────────────────────────────────────

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

// ── Signup ────────────────────────────────────────────────────────────────────

describe("POST /api/auth/signup", () => {
  it("creates a Learner and returns accessToken + user", async () => {
    const res = await request(app).post("/api/auth/signup").send(basePayload);

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user).toMatchObject({
      email: basePayload.email,
      role: "LEARNER",
      department: "Engineering",
      experienceLevel: "MID",
      teamName: null,
      birthdate: "1995-06-15",
      addresses: [],
    });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("creates a Manager with teamName", async () => {
    const res = await request(app).post("/api/auth/signup").send(managerPayload);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      role: "MANAGER",
      teamName: "Platform Team",
    });
  });

  it("creates a user with multiple addresses", async () => {
    const payload = {
      ...basePayload,
      addresses: [
        { label: "Home", street1: "1 Main St", city: "New York", zipCode: 10001 },
        { label: "Office", street1: "2 Work Ave", city: "Brooklyn", zipCode: 11201 },
      ],
    };

    const res = await request(app).post("/api/auth/signup").send(payload);

    expect(res.status).toBe(201);
    expect(res.body.user.addresses).toHaveLength(2);
    expect(res.body.user.addresses[0].label).toBe("Home");
    expect(res.body.user.addresses[1].label).toBe("Office");
  });

  it("stores bio when provided", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...basePayload, bio: "I love learning React." });

    expect(res.status).toBe(201);
    expect(res.body.user.bio).toBe("I love learning React.");
  });

  it("returns 409 when email is already in use", async () => {
    await request(app).post("/api/auth/signup").send(basePayload);
    const res = await request(app).post("/api/auth/signup").send(basePayload);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Email already in use");
  });

  it("returns 400 when Manager omits teamName", async () => {
    const { teamName: _, ...noTeam } = managerPayload;
    const res = await request(app).post("/api/auth/signup").send(noTeam);

    expect(res.status).toBe(400);
    expect(res.body.errors.teamName).toBeDefined();
  });

  it("returns 400 for invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...basePayload, email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.errors.email).toBeDefined();
  });

  it("returns 400 for password shorter than 8 characters", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...basePayload, password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.errors.password).toBeDefined();
  });

  it("returns 400 for invalid role value", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...basePayload, role: "ADMIN" });

    expect(res.status).toBe(400);
    expect(res.body.errors.role).toBeDefined();
  });

  it("returns 400 for invalid experienceLevel value", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...basePayload, experienceLevel: "EXPERT" });

    expect(res.status).toBe(400);
    expect(res.body.errors.experienceLevel).toBeDefined();
  });

  it("returns 400 for invalid department value", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...basePayload, department: "Finance" });

    expect(res.status).toBe(400);
    expect(res.body.errors.department).toBeDefined();
  });

  it("returns 400 for invalid birthdate format", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...basePayload, birthdate: "15-06-1995" });

    expect(res.status).toBe(400);
    expect(res.body.errors.birthdate).toBeDefined();
  });

  it("does not expose passwordHash in the response", async () => {
    const res = await request(app).post("/api/auth/signup").send(basePayload);
    expect(res.body.user.passwordHash).toBeUndefined();
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  it("returns accessToken and user on valid credentials", async () => {
    await request(app).post("/api/auth/signup").send(basePayload);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: basePayload.email, password: basePayload.password });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.email).toBe(basePayload.email);
  });

  it("returns 401 for wrong password", async () => {
    await request(app).post("/api/auth/signup").send(basePayload);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: basePayload.email, password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("returns 401 for unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: email("ghost"), password: "Secret123!" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });
});

// ── Me ────────────────────────────────────────────────────────────────────────

describe("GET /api/auth/me", () => {
  it("returns full user profile with addresses when authenticated", async () => {
    const payload = {
      ...basePayload,
      addresses: [
        { label: "Home", street1: "1 Main St", city: "NYC", zipCode: 10001 },
      ],
    };
    const token = await signupAndGetToken(payload);

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      email: basePayload.email,
      role: "LEARNER",
      department: "Engineering",
      experienceLevel: "MID",
      birthdate: "1995-06-15",
    });
    expect(res.body.user.addresses).toHaveLength(1);
    expect(res.body.user.addresses[0].label).toBe("Home");
  });

  it("returns 401 with no token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 with a malformed token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer not.a.valid.token");
    expect(res.status).toBe(401);
  });
});

// ── Check Email ───────────────────────────────────────────────────────────────

describe("GET /api/auth/check-email", () => {
  it("returns available: true for an unknown email", async () => {
    const res = await request(app)
      .get("/api/auth/check-email")
      .query({ email: email("unknown") });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ available: true });
  });

  it("returns available: false for a registered email", async () => {
    await request(app).post("/api/auth/signup").send(basePayload);

    const res = await request(app)
      .get("/api/auth/check-email")
      .query({ email: basePayload.email });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ available: false });
  });

  it("returns 400 when email param is missing", async () => {
    const res = await request(app).get("/api/auth/check-email");
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it("returns 400 for an invalid email format", async () => {
    const res = await request(app)
      .get("/api/auth/check-email")
      .query({ email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });
});
