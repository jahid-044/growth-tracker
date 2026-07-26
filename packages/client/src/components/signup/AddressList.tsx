import { useState } from "react";
import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { fieldClassName, labelClassName } from "@/components/ui/field";
import type { SignupFieldValues, SignupFormValues } from "@/lib/signupSchema";

export function AddressList() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<SignupFieldValues, unknown, SignupFormValues>();
  const { t } = useTranslation();

  const { fields, append, remove } = useFieldArray({ control, name: "addresses" });
  const watchedAddresses = useWatch({ control, name: "addresses" });
  const [openStates, setOpenStates] = useState<boolean[]>([]);

  function addAddress() {
    append({ label: "", street1: "", street2: "", city: "", zipCode: "" });
    setOpenStates((prev) => [...prev, true]);
  }

  function handleRemove(index: number) {
    remove(index);
    setOpenStates((prev) => prev.filter((_, i) => i !== index));
  }

  function toggle(index: number) {
    setOpenStates((prev) => prev.map((open, i) => (i === index ? !open : open)));
  }

  return (
    <div className="space-y-3">
      <span className={labelClassName}>
        {t("form.addresses.label")} <span className="text-neutral-400">{t("form.addresses.optional")}</span>
      </span>

      {fields.map((field, index) => (
        <div
          key={field.id}
          data-testid="address-group"
          className="rounded-md border border-neutral-200 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => toggle(index)}
              className="text-sm font-medium text-neutral-700"
            >
              {watchedAddresses?.[index]?.label || t("form.addresses.newAddress")}{" "}
              {openStates[index] ? "▲" : "▼"}
            </button>
            <button
              type="button"
              data-testid="remove-address-btn"
              onClick={() => handleRemove(index)}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              {t("form.addresses.remove")}
            </button>
          </div>

          {openStates[index] && (
            <div className="space-y-2">
              <input
                aria-label={t("form.addresses.labelField")}
                data-testid="address-label-input"
                placeholder={t("form.addresses.labelPlaceholder")}
                className={fieldClassName}
                {...register(`addresses.${index}.label`)}
              />
              {errors.addresses?.[index]?.label && (
                <p className="text-xs text-red-600">{errors.addresses?.[index]?.label?.message}</p>
              )}
              <input
                aria-label={t("form.addresses.street1")}
                data-testid="address-street1-input"
                placeholder={t("form.addresses.street1")}
                className={fieldClassName}
                {...register(`addresses.${index}.street1`)}
              />
              {errors.addresses?.[index]?.street1 && (
                <p className="text-xs text-red-600">{errors.addresses?.[index]?.street1?.message}</p>
              )}
              <input
                aria-label={t("form.addresses.street2Placeholder")}
                placeholder={t("form.addresses.street2Placeholder")}
                className={fieldClassName}
                {...register(`addresses.${index}.street2`)}
              />
              <div className="flex gap-2">
                <input
                  aria-label={t("form.addresses.city")}
                  data-testid="address-city-input"
                  placeholder={t("form.addresses.city")}
                  className={`flex-1 ${fieldClassName}`}
                  {...register(`addresses.${index}.city`)}
                />
                <input
                  aria-label={t("form.addresses.zip")}
                  data-testid="address-zip-input"
                  placeholder={t("form.addresses.zipPlaceholder")}
                  className="w-28 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
                  {...register(`addresses.${index}.zipCode`)}
                />
              </div>
              {(errors.addresses?.[index]?.city || errors.addresses?.[index]?.zipCode) && (
                <div className="flex gap-2">
                  <p className="flex-1 text-xs text-red-600">
                    {errors.addresses?.[index]?.city?.message}
                  </p>
                  <p className="w-28 text-xs text-red-600">
                    {errors.addresses?.[index]?.zipCode?.message}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        data-testid="add-address-btn"
        onClick={addAddress}
        className="w-full rounded-md border border-dashed border-neutral-300 px-3 py-2 text-sm text-neutral-500 hover:border-neutral-400 hover:text-neutral-700 transition-colors"
      >
        {t("form.addresses.add")}
      </button>
    </div>
  );
}
