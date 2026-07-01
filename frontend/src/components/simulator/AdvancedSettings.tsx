import { useState } from "react";
import { ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import type { AdvancedConfig } from "@/types/simulator";

interface AdvancedSettingsProps {
  value: AdvancedConfig;
  onChange: (value: AdvancedConfig) => void;
}

function inputCls() {
  return "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20";
}

function labelCls() {
  return "text-sm font-medium text-slate-700 dark:text-slate-300";
}

export function AdvancedSettings({ value, onChange }: AdvancedSettingsProps) {
  const [open, setOpen] = useState(false);

  const set = <K extends keyof AdvancedConfig>(key: K, v: AdvancedConfig[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-brand-sm dark:border-slate-700 dark:bg-slate-800/50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left sm:px-6"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <Settings2 size={16} />
          Configurações Avançadas
        </span>
        {open ? (
          <ChevronUp size={18} className="text-slate-400" />
        ) : (
          <ChevronDown size={18} className="text-slate-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-200 px-5 pb-5 pt-4 dark:border-slate-700 sm:px-6 sm:pb-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls()}>Correção dos Aportes (% a.a.)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                placeholder="0"
                className={`${inputCls()} mt-1`}
                value={value.correctionValue || ""}
                onChange={(e) => set("correctionValue", Number(e.target.value))}
              />
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Corrige os aportes mensais anualmente. Deixe 0 para nenhuma correção.
              </p>
            </div>

            <div>
              <label className={labelCls()}>Taxa de Administração (% a.a.)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                placeholder="0"
                className={`${inputCls()} mt-1`}
                value={value.managementFee || ""}
                onChange={(e) => set("managementFee", Number(e.target.value))}
              />
            </div>

            <div>
              <label className={labelCls()}>Tributação sobre Ganhos (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                inputMode="decimal"
                placeholder="0"
                className={`${inputCls()} mt-1`}
                value={value.taxation || ""}
                onChange={(e) => set("taxation", Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
