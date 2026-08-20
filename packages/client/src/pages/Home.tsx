import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/authStore";

function Home() {
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-lg space-y-6 rounded-xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-neutral-900">{t("home.title")}</h1>
      <p data-testid="user-email" className="text-sm text-neutral-600">
        {t("home.signedInAs", { email: user?.email })}
      </p>
    </div>
  );
}

export default Home;
