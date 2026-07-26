import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

function NotFound() {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();

  return (
    <div className="w-full max-w-lg space-y-6 rounded-xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-neutral-900">{t("notFound.title")}</h1>
      <p className="text-sm text-neutral-600">{t("notFound.body")}</p>
      <Link
        to={`/${lang}`}
        className="inline-block rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
      >
        {t("notFound.backToDashboard")}
      </Link>
    </div>
  );
}

export default NotFound;
