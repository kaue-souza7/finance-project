import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Drawer } from "@/components/Drawer";
import { Topbar } from "@/components/Topbar";

export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Pular para o conteúdo principal
      </a>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setDrawerOpen(true)} />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5 lg:p-6 mt-[calc(3.5rem+env(safe-area-inset-top,0px))]"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
