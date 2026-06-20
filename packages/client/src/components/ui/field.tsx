import type { ReactNode } from "react";

/** Control styling without a width utility — compose with `w-full`, `flex-1`, etc. */
export const fieldClassNameBase =
  "rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200";

/** Shared input/select/textarea styling for full-width form controls. */
export const fieldClassName = `w-full ${fieldClassNameBase}`;

/** Shared field label styling. */
export const labelClassName = "block text-sm font-medium text-neutral-700";

interface FormFieldProps {
  label: string;
  /** When provided, the label renders as a <label htmlFor>. Otherwise a <span>. */
  htmlFor?: string;
  optional?: boolean;
  /** Error message rendered below the control (caller decides when to show it). */
  error?: string;
  children: ReactNode;
}

/** Label + control + error wrapper used by the simple signup fields. */
export function FormField({ label, htmlFor, optional, error, children }: FormFieldProps) {
  const labelContent = (
    <>
      {label}
      {optional && <span className="text-neutral-400"> (optional)</span>}
    </>
  );

  return (
    <div className="space-y-1">
      {htmlFor ? (
        <label htmlFor={htmlFor} className={labelClassName}>
          {labelContent}
        </label>
      ) : (
        <span className={labelClassName}>{labelContent}</span>
      )}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
