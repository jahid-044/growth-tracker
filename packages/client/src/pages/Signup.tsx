import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface AddressItem {
  id: string;
  isOpen: boolean;
  label: string;
  street1: string;
  street2: string;
  city: string;
  zipCode: string;
}

const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Operations",
  "HR",
  "Other",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 10 - 1940 + 1 }, (_, i) =>
  String(1940 + i),
);
const MONTHS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
const DAYS = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);

function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"LEARNER" | "MANAGER">("LEARNER");
  const [teamName, setTeamName] = useState("");
  const [department, setDepartment] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<
    "JUNIOR" | "MID" | "SENIOR"
  >("JUNIOR");
  const [bio, setBio] = useState("");
  const [birthdateYear, setBirthdateYear] = useState("");
  const [birthdateMonth, setBirthdateMonth] = useState("");
  const [birthdateDay, setBirthdateDay] = useState("");
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const lengthMet = password.length >= 8;
  const upperMet = /[A-Z]/.test(password);
  const specialMet = /[^A-Za-z0-9]/.test(password);

  function handleRoleChange(newRole: "LEARNER" | "MANAGER") {
    setRole(newRole);
    if (newRole === "LEARNER") setTeamName("");
  }

  function addAddress() {
    setAddresses((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        isOpen: true,
        label: "",
        street1: "",
        street2: "",
        city: "",
        zipCode: "",
      },
    ]);
  }

  function removeAddress(id: string) {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  function updateAddress(
    id: string,
    field: keyof Omit<AddressItem, "id" | "isOpen">,
    value: string,
  ) {
    setAddresses((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    );
  }

  function toggleAddress(id: string) {
    setAddresses((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isOpen: !a.isOpen } : a)),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload: Record<string, unknown> = {
      email,
      password,
      role,
      department,
      experienceLevel,
      birthdate: `${birthdateYear}-${birthdateMonth}-${birthdateDay}`,
      addresses: addresses.map(
        ({ label, street1, street2, city, zipCode }) => ({
          label,
          street1,
          ...(street2 ? { street2 } : {}),
          city,
          zipCode: Number(zipCode),
        }),
      ),
    };

    if (role === "MANAGER") payload.teamName = teamName;
    if (bio) payload.bio = bio;

    try {
      const res = await fetch("http://localhost:8000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        return;
      }

      localStorage.setItem("accessToken", data.accessToken);
      navigate("/");
    } catch {
      setError("Unable to reach the server. Please check your connection and try again.");
    }
  }

  return (
    <form
      data-testid="signup-form"
      onSubmit={handleSubmit}
      className="w-full max-w-lg space-y-6 rounded-xl bg-white p-8 shadow-sm"
    >
      <h1 className="text-2xl font-semibold text-neutral-900">
        Create account
      </h1>

      {/* Email */}
      <div className="space-y-1">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-neutral-700"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          data-testid="email-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
        />
      </div>

      {/* Password */}
      <div className="space-y-1">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-neutral-700"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          data-testid="password-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
        />
        <ul className="mt-2 space-y-1 text-xs">
          <li
            data-testid="password-rule-length"
            data-met={lengthMet ? "true" : "false"}
            className={lengthMet ? "text-green-600" : "text-neutral-400"}
          >
            {lengthMet ? "✓" : "○"} At least 8 characters
          </li>
          <li
            data-testid="password-rule-upper"
            data-met={upperMet ? "true" : "false"}
            className={upperMet ? "text-green-600" : "text-neutral-400"}
          >
            {upperMet ? "✓" : "○"} At least one capital letter
          </li>
          <li
            data-testid="password-rule-special"
            data-met={specialMet ? "true" : "false"}
            className={specialMet ? "text-green-600" : "text-neutral-400"}
          >
            {specialMet ? "✓" : "○"} At least one special character
          </li>
        </ul>
      </div>

      {/* Role */}
      <div className="space-y-2">
        <span className="block text-sm font-medium text-neutral-700">Role</span>
        <div className="flex gap-3">
          {(["LEARNER", "MANAGER"] as const).map((r) => (
            <label
              key={r}
              className={`flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm transition-colors ${
                role === r
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-700 hover:border-neutral-400"
              }`}
            >
              <input
                type="radio"
                name="role"
                data-testid={r === "LEARNER" ? "role-learner" : "role-manager"}
                value={r}
                checked={role === r}
                onChange={() => handleRoleChange(r)}
                className="sr-only"
              />
              {r === "LEARNER" ? "Learner" : "Manager"}
            </label>
          ))}
        </div>
      </div>

      {/* Team name — only when MANAGER */}
      {role === "MANAGER" && (
        <div className="space-y-1">
          <label
            htmlFor="teamName"
            className="block text-sm font-medium text-neutral-700"
          >
            Team name
          </label>
          <input
            id="teamName"
            data-testid="team-name-input"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          />
        </div>
      )}

      {/* Department */}
      <div className="space-y-1">
        <label
          htmlFor="department"
          className="block text-sm font-medium text-neutral-700"
        >
          Department
        </label>
        <select
          id="department"
          data-testid="department-select"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
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
      </div>

      {/* Experience level */}
      <div className="space-y-2">
        <span className="block text-sm font-medium text-neutral-700">
          Experience level
        </span>
        <div className="flex gap-3">
          {(["JUNIOR", "MID", "SENIOR"] as const).map((level) => (
            <label
              key={level}
              className={`flex cursor-pointer items-center rounded-md border px-4 py-2 text-sm transition-colors ${
                experienceLevel === level
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 text-neutral-700 hover:border-neutral-400"
              }`}
            >
              <input
                type="radio"
                name="experienceLevel"
                data-testid={`experience-${level.toLowerCase()}`}
                value={level}
                checked={experienceLevel === level}
                onChange={() => setExperienceLevel(level)}
                className="sr-only"
              />
              {level}
            </label>
          ))}
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-neutral-700">
          Bio <span className="text-neutral-400">(optional)</span>
        </label>
        <textarea
          data-testid="bio-input"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={250}
          rows={3}
          name="bio"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
        />
        <p className="text-right text-xs text-neutral-400">
          <span data-testid="bio-char-count">{bio.length} / 250</span>
        </p>
      </div>

      {/* Birthdate */}
      <div className="space-y-1">
        <span className="block text-sm font-medium text-neutral-700">
          Date of birth
        </span>
        <div className="flex gap-2">
          <select
            id="birthdateYear"
            aria-label="Year"
            data-testid="birthdate-year"
            value={birthdateYear}
            onChange={(e) => setBirthdateYear(e.target.value)}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          >
            <option value="" disabled>
              Year
            </option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            id="birthdateMonth"
            aria-label="Month"
            data-testid="birthdate-month"
            value={birthdateMonth}
            onChange={(e) => setBirthdateMonth(e.target.value)}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          >
            <option value="" disabled>
              Month
            </option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            id="birthdateDay"
            aria-label="Day"
            data-testid="birthdate-day"
            value={birthdateDay}
            onChange={(e) => setBirthdateDay(e.target.value)}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          >
            <option value="" disabled>
              Day
            </option>
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Addresses */}
      <div className="space-y-3">
        <span className="block text-sm font-medium text-neutral-700">
          Addresses <span className="text-neutral-400">(optional)</span>
        </span>

        {addresses.map((addr) => (
          <div
            key={addr.id}
            data-testid="address-group"
            className="rounded-md border border-neutral-200 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => toggleAddress(addr.id)}
                className="text-sm font-medium text-neutral-700"
              >
                {addr.label || "New address"} {addr.isOpen ? "▲" : "▼"}
              </button>
              <button
                type="button"
                data-testid="remove-address-btn"
                onClick={() => removeAddress(addr.id)}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Remove
              </button>
            </div>

            {addr.isOpen && (
              <div className="space-y-2">
                <input
                  aria-label="Label"
                  data-testid="address-label-input"
                  value={addr.label}
                  onChange={(e) =>
                    updateAddress(addr.id, "label", e.target.value)
                  }
                  placeholder="Label (e.g. Home)"
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
                />
                <input
                  aria-label="Street address"
                  data-testid="address-street1-input"
                  value={addr.street1}
                  onChange={(e) =>
                    updateAddress(addr.id, "street1", e.target.value)
                  }
                  placeholder="Street address"
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
                />
                <input
                  aria-label="Apt, suite, etc. (optional)"
                  value={addr.street2}
                  onChange={(e) =>
                    updateAddress(addr.id, "street2", e.target.value)
                  }
                  placeholder="Apt, suite, etc. (optional)"
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
                />
                <div className="flex gap-2">
                  <input
                    aria-label="City"
                    data-testid="address-city-input"
                    value={addr.city}
                    onChange={(e) =>
                      updateAddress(addr.id, "city", e.target.value)
                    }
                    placeholder="City"
                    className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
                  />
                  <input
                    aria-label="ZIP code"
                    data-testid="address-zip-input"
                    value={addr.zipCode}
                    onChange={(e) =>
                      updateAddress(addr.id, "zipCode", e.target.value)
                    }
                    placeholder="ZIP"
                    className="w-28 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
                  />
                </div>
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
          + Add an address
        </button>
      </div>

      {/* Error */}
      {error && (
        <p data-testid="error-message" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        data-testid="submit-btn"
        className="w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
      >
        Create account
      </button>
    </form>
  );
}

export default Signup;
