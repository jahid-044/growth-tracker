import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { getRoleLabel, getDepartmentLabel } from "@/lib/enumLabels";

function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-lg space-y-6 rounded-xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-neutral-900">{t("profile.title")}</h1>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-neutral-500">{t("common.email")}</dt>
          <dd className="text-neutral-900">{user?.email}</dd>
        </div>
        {user?.role && (
          <div>
            <dt className="text-neutral-500">{t("common.role")}</dt>
            <dd className="text-neutral-900">{getRoleLabel(t, user.role)}</dd>
          </div>
        )}
        {user?.department && (
          <div>
            <dt className="text-neutral-500">{t("common.department")}</dt>
            <dd className="text-neutral-900">{getDepartmentLabel(t, user.department)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export default Profile;
