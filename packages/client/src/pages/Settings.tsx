import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "account", label: "Account" },
  { to: "security", label: "Security" },
];

function Settings() {
  return (
    <div className="w-full max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>

      <div className="flex gap-1 border-b border-neutral-200">
        {tabs.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-900"
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      <div className="rounded-xl bg-white p-8 shadow-sm">
        <Outlet />
      </div>
    </div>
  );
}

export default Settings;
