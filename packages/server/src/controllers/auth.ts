import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { config } from "../config";
import { AuthPayload } from "../middleware/requireAuth";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const REFRESH_COOKIE = "refreshToken";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: REFRESH_TOKEN_TTL_MS,
};

function issueTokens(userId: string, email: string) {
  const payload: AuthPayload = { sub: userId, email };
  const accessToken = jwt.sign(payload, config.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  const refreshToken = jwt.sign(payload, config.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
  return { accessToken, refreshToken };
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const addressSchema = z.object({
  label:   z.string().min(1).max(100),
  street1: z.string().min(1).max(200),
  street2: z.string().max(200).optional(),
  city:    z.string().min(1).max(100),
  state:   z.string().min(1).max(100),
  zipCode: z.string().min(1).max(20),
  country: z.string().min(1).max(100),
});

const signupSchema = z.object({
  email:     z.string().email(),
  password:  z.string().min(8),
  addresses: z.array(addressSchema).optional().default([]),
});

export async function signup(req: Request, res: Response): Promise<void> {
  const result = signupSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: "Validation error", errors: result.error.flatten().fieldErrors });
    return;
  }

  const { email, password, addresses } = result.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ message: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      addresses: { create: addresses },
    },
    include: { addresses: true },
  });

  const { accessToken, refreshToken } = issueTokens(user.id, user.email);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  res.status(201).json({ accessToken, user: { id: user.id, email: user.email, addresses: user.addresses } });
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = credentialsSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ message: "Validation error", errors: result.error.flatten().fieldErrors });
    return;
  }

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const { accessToken, refreshToken } = issueTokens(user.id, user.email);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
  res.json({ accessToken, user: { id: user.id, email: user.email } });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.cookies[REFRESH_COOKIE] as string | undefined;

  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }

  res.clearCookie(REFRESH_COOKIE);
  res.json({ message: "Logged out" });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies[REFRESH_COOKIE] as string | undefined;

  if (!token) {
    res.status(401).json({ message: "No refresh token" });
    return;
  }

  let payload: AuthPayload;
  try {
    payload = jwt.verify(token, config.JWT_REFRESH_SECRET) as AuthPayload;
  } catch {
    res.status(401).json({ message: "Invalid or expired refresh token" });
    return;
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    res.status(401).json({ message: "Refresh token revoked or expired" });
    return;
  }

  // Rotate: delete old, issue new
  await prisma.refreshToken.delete({ where: { token } });

  const { accessToken, refreshToken: newRefresh } = issueTokens(payload.sub, payload.email);

  await prisma.refreshToken.create({
    data: {
      token: newRefresh,
      userId: payload.sub,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  res.cookie(REFRESH_COOKIE, newRefresh, cookieOptions);
  res.json({ accessToken });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: { id: true, email: true, createdAt: true, addresses: true },
  });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json({ user });
}
