import { useCallback, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  CalendarCheck,
  ChartNoAxesColumn,
  LayoutDashboard,
  LayoutGrid,
  PiggyBank,
  Settings,
  Tags,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/Avatar";

const mainLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/plannings", label: "Planejamentos", icon: CalendarCheck },
  { to: "/investments", label: "Investimentos", icon: PiggyBank },
  { to: "/transactions", label: "Transações", icon: Wallet },
  { to: "/categories", label: "Categorias", icon: Tags },
];

const secondaryLinks = [
  { to: "/modules", label: "Outros módulos", icon: LayoutGrid },
];

interface DrawerProps {
  open: boolean;
  onClose: () => void;
}

export function Drawer({ open, onClose }: DrawerProps) {
  const { user } = useAuth();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.documentElement.classList.add("no-scroll");
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.documentElement.classList.remove("no-scroll");
    }
    return () => {
      document.documentElement.classList.remove("no-scroll");
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown]);

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
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-sidebar shadow-xl transition-transform duration-300 ease-out safe-area-inset-top safe-area-inset-bottom dark:border-slate-700 dark:bg-sidebar-dark lg:static lg:shadow-none lg:translate-x-0 ${
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
            {mainLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={onClose}
                    className={({ isActive }) =>
                    `flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white"
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

          <div className="my-3 mx-3 border-t border-slate-200 dark:border-slate-700" />

          <ul className="space-y-1">
            <li>
              <NavLink
                to="/simulador-metas"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`
                }
              >
                <ChartNoAxesColumn size={20} />
                Simulador de Metas
              </NavLink>
            </li>
            {secondaryLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white"
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
          {user && (
            <NavLink
              to="/profile"
              onClick={onClose}
              className={({ isActive }) =>
                `mb-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`
              }
            >
              <Avatar src={user.avatar_url} name={user.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                  {user.name}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {user.email}
                </p>
              </div>
            </NavLink>
          )}

          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white"
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
