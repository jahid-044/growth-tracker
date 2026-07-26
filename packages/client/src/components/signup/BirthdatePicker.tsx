import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { YEARS, MONTHS, getDaysInMonth, buildDays } from "@/lib/constants";
import { fieldClassNameBase, labelClassName } from "@/components/ui/field";
import type { SignupFieldValues, SignupFormValues } from "@/lib/signupSchema";

const selectClassName = `flex-1 ${fieldClassNameBase} disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-50`;

export function BirthdatePicker() {
  const {
    register,
    control,
    setValue,
    formState: { errors, touchedFields, isSubmitted },
  } = useFormContext<SignupFieldValues, unknown, SignupFormValues>();
  const { t } = useTranslation();

  const year = useWatch({ control, name: "birthdateYear" });
  const month = useWatch({ control, name: "birthdateMonth" });
  const days = buildDays(getDaysInMonth(year, month));

  // Changing the year invalidates the previously-picked month and day.
  useEffect(() => {
    setValue("birthdateMonth", "");
    setValue("birthdateDay", "");
  }, [year, setValue]);

  // Changing the month invalidates the previously-picked day.
  useEffect(() => {
    setValue("birthdateDay", "");
  }, [month, setValue]);

  const showError =
    isSubmitted ||
    (touchedFields.birthdateYear && touchedFields.birthdateMonth && touchedFields.birthdateDay);
  const errorMessage =
    errors.birthdateYear?.message ?? errors.birthdateMonth?.message ?? errors.birthdateDay?.message;

  return (
    <div className="space-y-1">
      <span className={labelClassName}>{t("form.birthdate.label")}</span>
      <div className="flex gap-2">
        <select
          id="birthdateYear"
          aria-label={t("form.birthdate.year")}
          data-testid="birthdate-year"
          className={selectClassName}
          {...register("birthdateYear")}
        >
          <option value="" disabled>
            {t("form.birthdate.year")}
          </option>
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          id="birthdateMonth"
          aria-label={t("form.birthdate.month")}
          data-testid="birthdate-month"
          disabled={!year}
          className={selectClassName}
          {...register("birthdateMonth")}
        >
          <option value="" disabled>
            {t("form.birthdate.month")}
          </option>
          {MONTHS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          id="birthdateDay"
          aria-label={t("form.birthdate.day")}
          data-testid="birthdate-day"
          disabled={!year || !month}
          className={selectClassName}
          {...register("birthdateDay")}
        >
          <option value="" disabled>
            {t("form.birthdate.day")}
          </option>
          {days.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      {showError && errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}
    </div>
  );
}
