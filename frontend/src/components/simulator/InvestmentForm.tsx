import type { InvestmentConfig, TimeUnit } from "@/types/simulator";

interface InvestmentFormProps {
  value: InvestmentConfig;
  onChange: (value: InvestmentConfig) => void;
}

function inputCls() {
  return "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20";
}

function labelCls() {
  return "text-sm font-medium text-slate-700 dark:text-slate-300";
}

export function InvestmentForm({ value, onChange }: InvestmentFormProps) {
  const set = <K extends keyof InvestmentConfig>(key: K, v: InvestmentConfig[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-brand-sm dark:border-slate-700 dark:bg-slate-800/50 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
        Configuração do Investimento
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls()}>Valor Inicial</label>
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0,00"
            className={`${inputCls()} mt-1`}
            value={value.initialValue || ""}
            onChange={(e) => set("initialValue", Number(e.target.value))}
          />
        </div>

        <div>
          <label className={labelCls()}>Aporte Mensal</label>
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0,00"
            className={`${inputCls()} mt-1`}
            value={value.monthlyValue || ""}
            onChange={(e) => set("monthlyValue", Number(e.target.value))}
          />
        </div>

        <div>
          <label className={labelCls()}>Rentabilidade Anual (%)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="0,00"
            className={`${inputCls()} mt-1`}
            value={value.yearlyInterestRate || ""}
            onChange={(e) => set("yearlyInterestRate", Number(e.target.value))}
          />
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className={labelCls()}>Prazo</label>
            <input
              type="number"
              step="1"
              min="1"
              inputMode="numeric"
              placeholder="1"
              className={`${inputCls()} mt-1`}
              value={value.timeValue || ""}
              onChange={(e) => set("timeValue", Number(e.target.value))}
            />
          </div>
          <div className="w-28">
            <label className={labelCls()}>&nbsp;</label>
            <select
              className={`${inputCls()} mt-1`}
              value={value.timeUnit}
              onChange={(e) => set("timeUnit", e.target.value as TimeUnit)}
            >
              <option value="years">Anos</option>
              <option value="months">Meses</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
