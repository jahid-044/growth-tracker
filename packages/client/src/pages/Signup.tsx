import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type Role = "LEARNER" | "MANAGER";
type ExperienceLevel = "JUNIOR" | "MID" | "SENIOR";

interface AddressFormState {
  id: string;
  isOpen: boolean;
  label: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface FormState {
  email: string;
  password: string;
  role: Role;
  department: string;
  experienceLevel: ExperienceLevel;
  teamName: string;
  addresses: AddressFormState[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Operations",
  "HR",
  "Other",
];

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string; description: string }[] = [
  { value: "JUNIOR", label: "Junior", description: "0–2 years" },
  { value: "MID",    label: "Mid",    description: "2–5 years" },
  { value: "SENIOR", label: "Senior", description: "5+ years"  },
];

// ── Password strength ─────────────────────────────────────────────────────────

function getStrength(password: string): { score: number; label: string } {
  if (!password) return { score: 0, label: "" };
  let score = 0;
  if (password.length >= 8)           score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[0-9]/.test(password))         score++;
  if (/[^A-Za-z0-9]/.test(password))  score++;
  const label = score <= 1 ? "Weak" : score <= 2 ? "Fair" : score <= 3 ? "Good" : "Strong";
  return { score, label };
}

const strengthColor = (score: number) =>
  score <= 1 ? "bg-red-500" : score <= 2 ? "bg-yellow-400" : score <= 3 ? "bg-blue-500" : "bg-green-500";

const strengthTextColor = (score: number) =>
  score <= 1 ? "text-red-600" : score <= 2 ? "text-yellow-600" : score <= 3 ? "text-blue-600" : "text-green-600";

// ── Helpers ───────────────────────────────────────────────────────────────────

const emptyAddress = (): AddressFormState => ({
  id: crypto.randomUUID(),
  isOpen: true,
  label: "",
  street1: "",
  street2: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
});

const inputCls =
  "w-full h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-neutral-600">{label}</label>
      {children}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    role: "LEARNER",
    department: "",
    experienceLevel: "JUNIOR",
    teamName: "",
    addresses: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const strength = getStrength(form.password);

  // ── Address handlers ──

  function addAddress() {
    setForm(prev => ({ ...prev, addresses: [...prev.addresses, emptyAddress()] }));
  }

  function removeAddress(id: string) {
    setForm(prev => ({ ...prev, addresses: prev.addresses.filter(a => a.id !== id) }));
  }

  function toggleAddress(id: string) {
    setForm(prev => ({
      ...prev,
      addresses: prev.addresses.map(a => (a.id === id ? { ...a, isOpen: !a.isOpen } : a)),
    }));
  }

  function updateAddressField(
    id: string,
    field: keyof Omit<AddressFormState, "id" | "isOpen">,
    value: string,
  ) {
    setForm(prev => ({
      ...prev,
      addresses: prev.addresses.map(a => (a.id === id ? { ...a, [field]: value } : a)),
    }));
  }

  // ── Submit ──

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      email:           form.email,
      password:        form.password,
      role:            form.role,
      department:      form.department,
      experienceLevel: form.experienceLevel,
      ...(form.role === "MANAGER" ? { teamName: form.teamName } : {}),
      addresses: form.addresses.map(({ label, street1, street2, city, state, zipCode, country }) => ({
        label,
        street1,
        ...(street2.trim() ? { street2 } : {}),
        city,
        state,
        zipCode,
        country,
      })),
    };

    try {
      const res = await fetch("http://localhost:8000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Signup failed");
        return;
      }

      localStorage.setItem("accessToken", data.accessToken);
      navigate("/");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md px-4 py-8">
      <h1 className="font-semibold text-2xl text-neutral-900 mb-1">Create account</h1>
      <p className="text-sm text-neutral-500 mb-6">Join your team on Growth Tracker</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* ── Email ── */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
            className={inputCls}
            placeholder="you@company.com"
          />
        </div>

        {/* ── Password + strength ── */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            value={form.password}
            onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
            className={inputCls}
            placeholder="Min. 8 characters"
          />
          {/* Strength indicator — only shown once the user starts typing */}
          {form.password.length > 0 && (
            <div className="flex flex-col gap-1 mt-0.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all duration-300",
                      strength.score >= i ? strengthColor(strength.score) : "bg-neutral-200",
                    )}
                  />
                ))}
              </div>
              <span className={cn("text-xs font-medium", strengthTextColor(strength.score))}>
                {strength.label}
              </span>
            </div>
          )}
        </div>

        {/* ── Role toggle ── */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-neutral-700">I am a</span>
          <div className="grid grid-cols-2 gap-2">
            {(["LEARNER", "MANAGER"] as Role[]).map(r => (
              <label
                key={r}
                className={cn(
                  "flex items-center justify-center gap-2 h-10 rounded-md border text-sm font-medium cursor-pointer transition-all",
                  form.role === r
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={form.role === r}
                  onChange={() => setForm(prev => ({ ...prev, role: r, teamName: "" }))}
                  className="sr-only"
                />
                {r === "LEARNER" ? "Learner" : "Manager"}
              </label>
            ))}
          </div>
        </div>

        {/* ── Team name — conditionally shown for Manager ── */}
        {form.role === "MANAGER" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700" htmlFor="teamName">
              Team name
            </label>
            <input
              id="teamName"
              type="text"
              required
              value={form.teamName}
              onChange={e => setForm(prev => ({ ...prev, teamName: e.target.value }))}
              className={inputCls}
              placeholder="e.g. Platform Team"
            />
          </div>
        )}

        {/* ── Department ── */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700" htmlFor="department">
            Department
          </label>
          <select
            id="department"
            required
            value={form.department}
            onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))}
            className={cn(inputCls, "cursor-pointer")}
          >
            <option value="" disabled>Select your department</option>
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* ── Experience level ── */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-neutral-700">Experience level</span>
          <div className="grid grid-cols-3 gap-2">
            {EXPERIENCE_LEVELS.map(({ value, label, description }) => (
              <label
                key={value}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 rounded-md border text-sm cursor-pointer transition-all",
                  form.experienceLevel === value
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
                )}
              >
                <input
                  type="radio"
                  name="experienceLevel"
                  value={value}
                  checked={form.experienceLevel === value}
                  onChange={() => setForm(prev => ({ ...prev, experienceLevel: value }))}
                  className="sr-only"
                />
                <span className="font-medium text-sm">{label}</span>
                <span className={cn("text-xs", form.experienceLevel === value ? "text-neutral-300" : "text-neutral-400")}>
                  {description}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* ── Addresses ── */}
        {form.addresses.length > 0 && (
          <div className="flex flex-col gap-2">
            {form.addresses.map((addr, index) => (
              <div
                key={addr.id}
                className="rounded-md border border-neutral-200 bg-white overflow-hidden"
              >
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggleAddress(addr.id)}
                    className="flex flex-1 items-center gap-2 text-left min-w-0"
                    aria-expanded={addr.isOpen}
                  >
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-neutral-500 transition-transform duration-200",
                        addr.isOpen && "rotate-180",
                      )}
                    />
                    <span className="text-sm font-medium text-neutral-900 truncate">
                      {addr.label.trim() || `Address ${index + 1}`}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAddress(addr.id)}
                    className="shrink-0 rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                    aria-label="Remove address"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                <div className={cn("border-t border-neutral-100 px-3 pb-3 pt-3 flex flex-col gap-3", !addr.isOpen && "hidden")}>
                  <Field label="Label">
                    <input
                      type="text"
                      required
                      value={addr.label}
                      onChange={e => updateAddressField(addr.id, "label", e.target.value)}
                      placeholder='e.g. "Home" or "Office"'
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Street address">
                    <input
                      type="text"
                      required
                      value={addr.street1}
                      onChange={e => updateAddressField(addr.id, "street1", e.target.value)}
                      placeholder="123 Main St"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Apt, suite, etc. (optional)">
                    <input
                      type="text"
                      value={addr.street2}
                      onChange={e => updateAddressField(addr.id, "street2", e.target.value)}
                      placeholder="Apt 4B"
                      className={inputCls}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="City">
                      <input type="text" required value={addr.city} onChange={e => updateAddressField(addr.id, "city", e.target.value)} placeholder="New York" className={inputCls} />
                    </Field>
                    <Field label="State / Province">
                      <input type="text" required value={addr.state} onChange={e => updateAddressField(addr.id, "state", e.target.value)} placeholder="NY" className={inputCls} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="ZIP / Postal code">
                      <input type="text" required value={addr.zipCode} onChange={e => updateAddressField(addr.id, "zipCode", e.target.value)} placeholder="10001" className={inputCls} />
                    </Field>
                    <Field label="Country">
                      <input type="text" required value={addr.country} onChange={e => updateAddressField(addr.id, "country", e.target.value)} placeholder="US" className={inputCls} />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button type="button" variant="ghost" size="sm" onClick={addAddress} className="self-start gap-1.5">
          <Plus className="size-4" />
          Add{form.addresses.length > 0 ? " another" : " an"} address
        </Button>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account…" : "Create account"}
        </Button>

        <p className="text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <a href="/login" className="font-medium text-neutral-900 hover:underline">Log in</a>
        </p>

      </form>
    </div>
  );
}

export default Signup;
