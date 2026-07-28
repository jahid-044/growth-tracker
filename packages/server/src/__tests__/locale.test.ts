import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { app } from "../app";

const prisma = new PrismaClient();

const TEST_EMAIL_SUFFIX = "@test.growthtracker.local";
const email = (name: string) => `${name}${TEST_EMAIL_SUFFIX}`;

async function cleanupTestUsers() {
  await prisma.user.deleteMany({ where: { email: { endsWith: TEST_EMAIL_SUFFIX } } });
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

const payload = {
  email: email("locale-user"),
  password: "Secret123!",
  role: "LEARNER" as const,
  department: "Engineering",
  experienceLevel: "MID" as const,
  birthdate: "1995-06-15",
};

describe("Accept-Language localization", () => {
  it("defaults to English when no Accept-Language header is sent", async () => {
    await request(app).post("/api/auth/signup").send(payload);

    const res = await request(app).post("/api/auth/login").send({ email: payload.email, password: "wrongpass1" });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("returns an Arabic message for Accept-Language: ar, with the same code", async () => {
    await request(app).post("/api/auth/signup").send(payload);

    const res = await request(app)
      .post("/api/auth/login")
      .set("Accept-Language", "ar")
      .send({ email: payload.email, password: "wrongpass1" });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
    expect(res.body.message).toBe("بيانات اعتماد غير صحيحة");
  });

  it("resolves a browser-style Accept-Language header (ar-EG,ar;q=0.9) to Arabic", async () => {
    await request(app).post("/api/auth/signup").send(payload);

    const res = await request(app)
      .post("/api/auth/login")
      .set("Accept-Language", "ar-EG,ar;q=0.9")
      .send({ email: payload.email, password: "wrongpass1" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("بيانات اعتماد غير صحيحة");
  });

  it("defaults to English for an unsupported language", async () => {
    await request(app).post("/api/auth/signup").send(payload);

    const res = await request(app)
      .post("/api/auth/login")
      .set("Accept-Language", "fr")
      .send({ email: payload.email, password: "wrongpass1" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

  it("localizes middleware-level errors too (requireAuth)", async () => {
    const res = await request(app).get("/api/users").set("Accept-Language", "ar");

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("MISSING_AUTH_HEADER");
    expect(res.body.message).toBe("رأس التفويض مفقود أو غير صالح");
  });
});
