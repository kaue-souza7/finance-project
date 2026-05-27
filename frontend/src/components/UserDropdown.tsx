import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/Avatar";

export function UserDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    };
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open, close]);

  if (!user) return null;

  const items = [
    {
      label: "Meu Perfil",
      icon: User,
      action: () => { close(); navigate("/profile"); },
    },
    {
      label: "Configurações",
      icon: Settings,
      action: () => { close(); navigate("/settings"); },
    },
    { type: "separator" as const },
    {
      label: "Sair",
      icon: LogOut,
      action: () => { close(); logout(); },
      danger: true,
    },
  ];

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg p-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        aria-label="Menu do usuário"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Avatar src={user.avatar_url} name={user.name} size="sm" />
        <span className="hidden max-w-[120px] truncate font-medium md:inline">
          {user.name}
        </span>
        <ChevronDown
          size={14}
          className={`hidden transition-transform duration-200 md:block ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right animate-dropdown rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
              {user.name}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {user.email}
            </p>
          </div>

          <div className="py-1">
            {items.map((item) => {
              if ("type" in item && item.type === "separator") {
                return (
                  <div
                    key="sep"
                    className="my-1 border-t border-slate-100 dark:border-slate-700"
                  />
                );
              }
              if ("action" in item) {
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    role="menuitem"
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      "danger" in item && item.danger
                        ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </button>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
