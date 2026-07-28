import { Request, Response, NextFunction } from "express";
import { SUPPORTED_LOCALES, SupportedLocale } from "../lib/errorMessages";

declare global {
  namespace Express {
    interface Request {
      locale: SupportedLocale;
    }
  }
}

/** Extracts the first language tag from an Accept-Language header, e.g. "ar-EG,ar;q=0.9" -> "ar". */
function parseLocale(header: string | undefined): SupportedLocale {
  const tag = header?.split(",")[0]?.trim().slice(0, 2).toLowerCase();
  return (SUPPORTED_LOCALES as string[]).includes(tag ?? "") ? (tag as SupportedLocale) : "en";
}

export function locale(req: Request, _res: Response, next: NextFunction): void {
  req.locale = parseLocale(req.headers["accept-language"]);
  next();
}
