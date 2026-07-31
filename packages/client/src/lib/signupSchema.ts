import { z } from "zod";
import type { TFunction } from "i18next";
import { DEPARTMENTS } from "@/lib/constants";

const PASSWORD_MIN_LENGTH = 8;

function buildAddressSchema(t: TFunction) {
  return z.object({
    label:   z.string().min(1, t("validation.addressLabelRequired")),
    street1: z.string().min(1, t("validation.addressStreetRequired")),
    street2: z.string().optional(),
    city:    z.string().min(1, t("validation.addressCityRequired")),
    zipCode: z.string()
               .min(1, t("validation.addressZipRequired"))
               .regex(/^\d+$/, t("validation.addressZipNumeric")),
  });
}

export function buildSignupSchema(t: TFunction) {
  const addressSchema = buildAddressSchema(t);

  return z
    .object({
      email:           z.string().min(1, t("validation.emailRequired")).email(t("validation.emailInvalid")),
      password:        z.string()
                         .min(PASSWORD_MIN_LENGTH, t("validation.passwordMinLength", { length: PASSWORD_MIN_LENGTH }))
                         .regex(/[A-Z]/, t("validation.passwordUpper"))
                         .regex(/[^A-Za-z0-9]/, t("validation.passwordSpecial")),
      role:            z.enum(["LEARNER", "MANAGER"]),
      teamName:        z.string().max(100).optional(),
      department:      z.string()
                         .min(1, t("validation.departmentRequired"))
                         .pipe(z.enum(DEPARTMENTS)),
      experienceLevel: z.enum(["JUNIOR", "MID", "SENIOR"]),
      bio:             z.string().max(250).optional(),
      birthdateYear:   z.string().min(1, t("validation.yearRequired")),
      birthdateMonth:  z.string().min(1, t("validation.monthRequired")),
      birthdateDay:    z.string().min(1, t("validation.dayRequired")),
      addresses:       z.array(addressSchema).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.role === "MANAGER" && !data.teamName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("validation.teamNameRequired"),
          path: ["teamName"],
        });
      }

      // Guard against an impossible or future date reaching the server, even though
      // the UI's cascading selects already prevent picking a non-existent day.
      if (data.birthdateYear && data.birthdateMonth && data.birthdateDay) {
        const y = Number(data.birthdateYear);
        const m = Number(data.birthdateMonth);
        const d = Number(data.birthdateDay);
        const date = new Date(y, m - 1, d);
        const isRealDate =
          date.getFullYear() === y &&
          date.getMonth() === m - 1 &&
          date.getDate() === d;

        if (!isRealDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("validation.birthdateInvalid"),
            path: ["birthdateDay"],
          });
        } else if (date > new Date()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("validation.birthdateFuture"),
            path: ["birthdateDay"],
          });
        }
      }
    });
}

export type SignupFormValues = z.infer<ReturnType<typeof buildSignupSchema>>;
export type SignupFieldValues = z.input<ReturnType<typeof buildSignupSchema>>;
