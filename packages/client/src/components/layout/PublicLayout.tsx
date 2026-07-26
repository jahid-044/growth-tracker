import { Outlet } from "react-router-dom";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

function PublicLayout() {
  return (
    <div className="w-full min-h-dvh flex flex-col items-center bg-neutral-50 py-10">
      <div className="w-full max-w-lg flex justify-end pb-4">
        <LanguageSwitcher />
      </div>
      <Outlet />
    </div>
  );
}

export default PublicLayout;
