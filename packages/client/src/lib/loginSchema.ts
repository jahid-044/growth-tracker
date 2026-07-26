import { z } from "zod";
import type { TFunction } from "i18next";

export function buildLoginSchema(t: TFunction) {
  return z.object({
    email: z.string().min(1, t("validation.emailRequired")).email(t("validation.emailInvalid")),
    password: z.string().min(1, t("validation.passwordRequired")),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof buildLoginSchema>>;
