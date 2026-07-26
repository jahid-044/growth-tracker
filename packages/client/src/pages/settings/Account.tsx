import { useTranslation } from "react-i18next";

function Account() {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-medium text-neutral-900">{t("settings.account.title")}</h2>
      <p className="text-sm text-neutral-600">{t("settings.account.placeholder")}</p>
    </div>
  );
}

export default Account;
