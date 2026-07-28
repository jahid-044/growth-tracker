export type SupportedLocale = "en" | "ar";

export const SUPPORTED_LOCALES: SupportedLocale[] = ["en", "ar"];

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "EMAIL_IN_USE"
  | "INVALID_CREDENTIALS"
  | "LOGGED_OUT"
  | "NO_REFRESH_TOKEN"
  | "INVALID_REFRESH_TOKEN"
  | "REFRESH_TOKEN_REVOKED"
  | "USER_NOT_FOUND"
  | "EMAIL_QUERY_REQUIRED"
  | "INVALID_EMAIL"
  | "MISSING_AUTH_HEADER"
  | "INVALID_ACCESS_TOKEN";

// Arabic wording for INVALID_CREDENTIALS/EMAIL_IN_USE mirrors
// packages/client/src/locales/ar.json's auth.errors keys verbatim.
const MESSAGES: Record<ErrorCode, Record<SupportedLocale, string>> = {
  VALIDATION_ERROR: {
    en: "Validation error",
    ar: "خطأ في التحقق من الصحة",
  },
  EMAIL_IN_USE: {
    en: "Email already in use",
    ar: "البريد الإلكتروني مستخدم بالفعل",
  },
  INVALID_CREDENTIALS: {
    en: "Invalid credentials",
    ar: "بيانات اعتماد غير صحيحة",
  },
  LOGGED_OUT: {
    en: "Logged out",
    ar: "تم تسجيل الخروج",
  },
  NO_REFRESH_TOKEN: {
    en: "No refresh token",
    ar: "لا يوجد رمز تحديث",
  },
  INVALID_REFRESH_TOKEN: {
    en: "Invalid or expired refresh token",
    ar: "رمز التحديث غير صالح أو منتهي الصلاحية",
  },
  REFRESH_TOKEN_REVOKED: {
    en: "Refresh token revoked or expired",
    ar: "تم إلغاء رمز التحديث أو انتهت صلاحيته",
  },
  USER_NOT_FOUND: {
    en: "User not found",
    ar: "المستخدم غير موجود",
  },
  EMAIL_QUERY_REQUIRED: {
    en: "email query parameter is required",
    ar: "معامل الاستعلام email مطلوب",
  },
  INVALID_EMAIL: {
    en: "Invalid email address",
    ar: "عنوان بريد إلكتروني غير صالح",
  },
  MISSING_AUTH_HEADER: {
    en: "Missing or invalid Authorization header",
    ar: "رأس التفويض مفقود أو غير صالح",
  },
  INVALID_ACCESS_TOKEN: {
    en: "Invalid or expired access token",
    ar: "رمز الوصول غير صالح أو منتهي الصلاحية",
  },
};

export function localizeError(code: ErrorCode, locale: SupportedLocale): string {
  return MESSAGES[code][locale];
}
