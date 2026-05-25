import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Drawer } from "@/components/Drawer";
import { Topbar } from "@/components/Topbar";

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setDrawerOpen(true)} />
        <main className="mt-14 flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
