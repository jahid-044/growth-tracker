import { useFormContext } from "react-hook-form";
import { checkEmailAvailable } from "@/lib/api";
import { FormField, fieldClassName } from "@/components/ui/field";
import { useFocusGuard } from "@/hooks/useFocusGuard";
import type { SignupFieldValues, SignupFormValues } from "@/lib/signupSchema";

export function EmailField() {
  const {
    register,
    trigger,
    setError,
    getValues,
    formState: { errors },
  } = useFormContext<SignupFieldValues, unknown, SignupFormValues>();

  const guard = useFocusGuard();
  const { onBlur: rhfBlur, ...rest } = register("email");

  return (
    <FormField
      label="Email"
      htmlFor="email"
      error={!guard.focused ? errors.email?.message : undefined}
    >
      <input
        id="email"
        data-testid="email-input"
        type="email"
        autoComplete="email"
        className={fieldClassName}
        {...rest}
        onFocus={guard.onFocus}
        onBlur={async (e) => {
          guard.onBlur();
          await rhfBlur(e);
          // Only hit the availability endpoint once the email itself is valid.
          if (!(await trigger("email"))) return;
          const available = await checkEmailAvailable(getValues("email"));
          if (!available) {
            setError("email", { type: "manual", message: "Email is already in use" });
          }
        }}
      />
    </FormField>
  );
}
