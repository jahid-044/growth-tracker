import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { DEPARTMENTS } from "@/lib/constants";
import { getDepartmentLabel } from "@/lib/enumLabels";
import { FormField, fieldClassName } from "@/components/ui/field";
import { useFocusGuard } from "@/hooks/useFocusGuard";
import type { SignupFieldValues, SignupFormValues } from "@/lib/signupSchema";

export function DepartmentField() {
  const {
    register,
    formState: { errors },
  } = useFormContext<SignupFieldValues, unknown, SignupFormValues>();
  const { t } = useTranslation();

  const guard = useFocusGuard();
  const { onBlur: rhfBlur, ...rest } = register("department");

  return (
    <FormField
      label={t("common.department")}
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
          {t("form.departmentPlaceholder")}
        </option>
        {DEPARTMENTS.map((d) => (
          <option key={d} value={d}>
            {getDepartmentLabel(t, d)}
          </option>
        ))}
      </select>
    </FormField>
  );
}
