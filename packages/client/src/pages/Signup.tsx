import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  addresses: AddressFormState[];
}

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

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({ email: "", password: "", addresses: [] });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      email: form.email,
      password: form.password,
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
    <div className="w-full max-w-md px-4">
      <h1 className="font-semibold text-2xl text-neutral-900 mb-6">Create account</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Credentials */}
        <div className="flex flex-col gap-3">
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
              className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 transition-all"
              placeholder="you@example.com"
            />
          </div>

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
              className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 transition-all"
              placeholder="Min. 8 characters"
            />
          </div>
        </div>

        {/* Address groups */}
        {form.addresses.length > 0 && (
          <div className="flex flex-col gap-2">
            {form.addresses.map((addr, index) => (
              <div
                key={addr.id}
                className="rounded-md border border-neutral-200 bg-white overflow-hidden"
              >
                {/* Header */}
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

                {/* Collapsible body */}
                <div className={cn("border-t border-neutral-100 px-3 pb-3 pt-3 flex flex-col gap-3", !addr.isOpen && "hidden")}>
                  <Field label="Label" placeholder='e.g. "Home" or "Office"'>
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
                      <input
                        type="text"
                        required
                        value={addr.city}
                        onChange={e => updateAddressField(addr.id, "city", e.target.value)}
                        placeholder="New York"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="State / Province">
                      <input
                        type="text"
                        required
                        value={addr.state}
                        onChange={e => updateAddressField(addr.id, "state", e.target.value)}
                        placeholder="NY"
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="ZIP / Postal code">
                      <input
                        type="text"
                        required
                        value={addr.zipCode}
                        onChange={e => updateAddressField(addr.id, "zipCode", e.target.value)}
                        placeholder="10001"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Country">
                      <input
                        type="text"
                        required
                        value={addr.country}
                        onChange={e => updateAddressField(addr.id, "country", e.target.value)}
                        placeholder="US"
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add address */}
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
          <a href="/login" className="font-medium text-neutral-900 hover:underline">
            Log in
          </a>
        </p>
      </form>
    </div>
  );
}

const inputCls =
  "w-full h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 transition-all";

function Field({ label, children }: { label: string; placeholder?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-neutral-600">{label}</label>
      {children}
    </div>
  );
}

export default Signup;
