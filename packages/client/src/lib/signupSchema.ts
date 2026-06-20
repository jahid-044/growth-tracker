import { z } from "zod";
import { DEPARTMENTS } from "@/lib/constants";

const addressSchema = z.object({
  label:   z.string().min(1, "Label is required"),
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city:    z.string().min(1, "City is required"),
  zipCode: z.string()
             .min(1, "ZIP code is required")
             .regex(/^\d+$/, "ZIP code must be numeric"),
});

export const signupSchema = z
  .object({
    email:           z.string().min(1, "Email is required").email("Must be a valid email"),
    password:        z.string()
                       .min(8, "Must be at least 8 characters")
                       .regex(/[A-Z]/, "Must contain at least one capital letter")
                       .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    role:            z.enum(["LEARNER", "MANAGER"]),
    teamName:        z.string().max(100).optional(),
    department:      z.string()
                       .min(1, "Department is required")
                       .pipe(z.enum(DEPARTMENTS)),
    experienceLevel: z.enum(["JUNIOR", "MID", "SENIOR"]),
    bio:             z.string().max(250).optional(),
    birthdateYear:   z.string().min(1, "Year is required"),
    birthdateMonth:  z.string().min(1, "Month is required"),
    birthdateDay:    z.string().min(1, "Day is required"),
    addresses:       z.array(addressSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "MANAGER" && !data.teamName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Team name is required for managers",
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
          message: "Please select a valid date",
          path: ["birthdateDay"],
        });
      } else if (date > new Date()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date of birth cannot be in the future",
          path: ["birthdateDay"],
        });
      }
    }
  });

export type SignupFormValues = z.infer<typeof signupSchema>;
export type SignupFieldValues = z.input<typeof signupSchema>;
