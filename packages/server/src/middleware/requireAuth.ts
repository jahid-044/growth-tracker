import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { localizeError } from "../lib/errorMessages";

export interface AuthPayload {
  sub: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({
      code: "MISSING_AUTH_HEADER",
      message: localizeError("MISSING_AUTH_HEADER", req.locale),
    });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({
      code: "INVALID_ACCESS_TOKEN",
      message: localizeError("INVALID_ACCESS_TOKEN", req.locale),
    });
  }
}
