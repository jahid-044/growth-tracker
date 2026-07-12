import { Outlet } from "react-router-dom";

function PublicLayout() {
  return (
    <div className="w-full min-h-dvh flex items-start justify-center bg-neutral-50 py-10">
      <Outlet />
    </div>
  );
}

export default PublicLayout;
