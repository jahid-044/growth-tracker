import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, Settings, LogOut, User, Users } from "lucide-react";
import { logout } from "@/lib/authActions";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

function Sidebar() {
  const navigate = useNavigate();
  const email = useAuthStore((s) => s.user?.email);
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();

  const navItems = [
    { to: `/${lang}`, label: t("nav.dashboard"), icon: LayoutDashboard, end: true },
    { to: `/${lang}/profile`, label: t("nav.profile"), icon: User, end: false },
    { to: `/${lang}/users`, label: t("nav.users"), icon: Users, end: false },
    { to: `/${lang}/settings`, label: t("nav.settings"), icon: Settings, end: false },
  ];

  async function handleLogout() {
    await logout();
    navigate(`/${lang}/login`, { replace: true });
  }

  return (
    <aside className="flex h-dvh w-56 shrink-0 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between px-4 py-5">
        <span className="text-lg font-semibold">{t("nav.appName")}</span>
      </div>

      <div className="px-4 pb-3">
        <LanguageSwitcher />
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <p className="truncate px-1 pb-2 text-xs text-sidebar-foreground/60">{email}</p>
        <button
          type="button"
          data-testid="logout-btn"
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4" />
          {t("nav.logout")}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
