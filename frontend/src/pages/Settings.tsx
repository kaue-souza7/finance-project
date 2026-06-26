import { Moon, Sun, SunMoon } from "lucide-react";
import { usePreferences } from "@/contexts/PreferencesContext";

export function Settings() {
  const { theme, setTheme, density, setDensity } = usePreferences();

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Configurações
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Personalize sua experiência.
      </p>

      <div className="mt-6 space-y-6">
        <CardSection title="Aparência">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Escolha entre tema claro, escuro ou automático.
          </p>
          <div className="mt-3 flex gap-3">
            <OptionCard
              icon={<Sun size={20} />}
              label="Claro"
              selected={theme === "light"}
              onClick={() => setTheme("light")}
            />
            <OptionCard
              icon={<Moon size={20} />}
              label="Escuro"
              selected={theme === "dark"}
              onClick={() => setTheme("dark")}
            />
          </div>
        </CardSection>

        <CardSection title="Densidade">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Controle o espaçamento dos elementos na interface.
          </p>
          <div className="mt-3 flex gap-3">
            <OptionCard
              icon={<SunMoon size={20} />}
              label="Confortável"
              selected={density === "comfortable"}
              onClick={() => setDensity("comfortable")}
            />
            <OptionCard
              icon={<SunMoon size={20} />}
              label="Compacto"
              selected={density === "compact"}
              onClick={() => setDensity("compact")}
            />
          </div>
        </CardSection>
      </div>
    </section>
  );
}

function CardSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/50">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
        {title}
      </h2>
      {children}
    </div>
  );
}

function OptionCard({
  icon,
  label,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
        selected
          ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500 dark:text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
