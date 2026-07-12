import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";

function AppLayout() {
  return (
    <div className="flex h-dvh w-full bg-neutral-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
