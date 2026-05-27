import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/PreferencesContext";
import { UserDropdown } from "@/components/UserDropdown";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 sm:px-4">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onMenuClick}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
        <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          Finance
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Alternar tema"
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <UserDropdown />
      </div>
    </header>
  );
}
