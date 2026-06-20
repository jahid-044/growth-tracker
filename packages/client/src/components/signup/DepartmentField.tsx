import { useFormContext } from "react-hook-form";
import { DEPARTMENTS } from "@/lib/constants";
import { FormField, fieldClassName } from "@/components/ui/field";
import { useFocusGuard } from "@/hooks/useFocusGuard";
import type { SignupFieldValues, SignupFormValues } from "@/lib/signupSchema";

export function DepartmentField() {
  const {
    register,
    formState: { errors },
  } = useFormContext<SignupFieldValues, unknown, SignupFormValues>();

  const guard = useFocusGuard();
  const { onBlur: rhfBlur, ...rest } = register("department");

  return (
    <FormField
      label="Department"
      htmlFor="department"
      error={!guard.focused ? errors.department?.message : undefined}
    >
      <select
        id="department"
        data-testid="department-select"
        className={fieldClassName}
        {...rest}
        onFocus={guard.onFocus}
        onBlur={(e) => {
          guard.onBlur();
          void rhfBlur(e);
        }}
      >
        <option value="" disabled>
          Select a department
        </option>
        {DEPARTMENTS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </FormField>
  );
}
