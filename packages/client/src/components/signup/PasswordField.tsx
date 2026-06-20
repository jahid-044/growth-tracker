import { useFormContext, useWatch } from "react-hook-form";
import { fieldClassName, labelClassName } from "@/components/ui/field";
import { useFocusGuard } from "@/hooks/useFocusGuard";
import type { SignupFieldValues, SignupFormValues } from "@/lib/signupSchema";

const PASSWORD_RULES = [
  { testid: "password-rule-length", label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { testid: "password-rule-upper", label: "At least one capital letter", test: (pw: string) => /[A-Z]/.test(pw) },
  { testid: "password-rule-special", label: "At least one special character", test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
] as const;

export function PasswordField() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<SignupFieldValues, unknown, SignupFormValues>();

  const guard = useFocusGuard();
  const password = useWatch({ control, name: "password" }) ?? "";
  const { onBlur: rhfBlur, ...rest } = register("password");

  return (
    <div className="space-y-1">
      <label htmlFor="password" className={labelClassName}>
        Password
      </label>
      <input
        id="password"
        data-testid="password-input"
        type="password"
        autoComplete="new-password"
        className={fieldClassName}
        {...rest}
        onFocus={guard.onFocus}
        onBlur={(e) => {
          guard.onBlur();
          void rhfBlur(e);
        }}
      />
      {errors.password && !guard.focused && (
        <p className="text-xs text-red-600">{errors.password.message}</p>
      )}
      <ul className="mt-2 space-y-1 text-xs">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <li
              key={rule.testid}
              data-testid={rule.testid}
              data-met={met ? "true" : "false"}
              className={met ? "text-green-600" : "text-neutral-400"}
            >
              {met ? "✓" : "○"} {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
