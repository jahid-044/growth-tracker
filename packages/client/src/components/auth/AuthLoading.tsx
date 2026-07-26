import { useTranslation } from "react-i18next";

/** Full-height placeholder shown while the session is being restored on load. */
export function AuthLoading() {
  const { t } = useTranslation();

  return (
    <p data-testid="auth-loading" className="text-sm text-neutral-500">
      {t("common.loading")}
    </p>
  );
}
