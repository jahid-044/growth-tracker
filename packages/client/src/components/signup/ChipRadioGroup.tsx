import { labelClassName } from "@/components/ui/field";

interface ChipOption<T extends string> {
  value: T;
  label: string;
  testid: string;
}

interface ChipRadioGroupProps<T extends string> {
  label: string;
  /** Radio group `name` attribute (shared across the options). */
  name: string;
  value: T;
  options: ChipOption<T>[];
  onChange: (value: T) => void;
}

/** A radio group rendered as selectable "chip" buttons (used for role & experience). */
export function ChipRadioGroup<T extends string>({
  label,
  name,
  value,
  options,
  onChange,
}: ChipRadioGroupProps<T>) {
  return (
    <div className="space-y-2">
      <span className={labelClassName}>{label}</span>
      <div className="flex gap-3">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors ${
              value === option.value
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 text-neutral-700 hover:border-neutral-400"
            }`}
          >
            <input
              type="radio"
              name={name}
              data-testid={option.testid}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}
