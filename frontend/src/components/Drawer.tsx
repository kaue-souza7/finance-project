import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  CalendarCheck,
  LayoutDashboard,
  PiggyBank,
  Settings,
  Tags,
  Wallet,
  X,
} from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/plannings", label: "Planejamentos", icon: CalendarCheck },
  { to: "/investments", label: "Investimentos", icon: PiggyBank },
  { to: "/transactions", label: "Transações", icon: Wallet },
  { to: "/categories", label: "Categorias", icon: Tags },
];

interface DrawerProps {
  open: boolean;
  onClose: () => void;
}

export function Drawer({ open, onClose }: DrawerProps) {
  useEffect(() => {
    if (open) {
      document.documentElement.classList.add("no-scroll");
    } else {
      document.documentElement.classList.remove("no-scroll");
    }
    return () => document.documentElement.classList.remove("no-scroll");
  }, [open]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-sidebar shadow-xl transition-transform duration-300 ease-out dark:border-slate-700 dark:bg-sidebar-dark lg:static lg:shadow-none lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-700">
          <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
            Finance
          </span>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-700"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain p-3">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`
                  }
                >
                  <link.icon size={20} />
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-200 p-3 dark:border-slate-700">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`
            }
          >
            <Settings size={20} />
            Configurações
          </NavLink>
        </div>
      </aside>
    </>
  );
}
