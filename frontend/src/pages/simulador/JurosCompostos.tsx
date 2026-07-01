import { useState } from "react";
import { ArrowLeft, Calculator, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { InvestmentForm } from "@/components/simulator/InvestmentForm";
import { EsporadicContributions } from "@/components/simulator/EsporadicContributions";
import { AdvancedSettings } from "@/components/simulator/AdvancedSettings";
import { SimulationResult } from "@/components/simulator/SimulationResult";
import { calculateCompoundInterest } from "@/hooks/useCompoundInterest";
import type {
  InvestmentConfig,
  AdvancedConfig,
  EsporadicContribution,
  SimulationInput,
  SimulationResult as SimulationResultType,
} from "@/types/simulator";

const DEFAULT_INVESTMENT: InvestmentConfig = {
  initialValue: 1000,
  monthlyValue: 500,
  yearlyInterestRate: 12,
  timeValue: 10,
  timeUnit: "years",
};

const DEFAULT_ADVANCED: AdvancedConfig = {
  correctionValue: 0,
  managementFee: 0,
  taxation: 15,
};

export function JurosCompostos() {
  const [investment, setInvestment] = useState<InvestmentConfig>(DEFAULT_INVESTMENT);
  const [contributions, setContributions] = useState<EsporadicContribution[]>([]);
  const [advanced, setAdvanced] = useState<AdvancedConfig>(DEFAULT_ADVANCED);
  const [result, setResult] = useState<SimulationResultType | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const totalMonths =
    investment.timeUnit === "years"
      ? investment.timeValue * 12
      : investment.timeValue;

  const handleSimulate = () => {
    const input: SimulationInput = {
      investment,
      contributions,
      advanced,
    };
    const res = calculateCompoundInterest(input);
    setResult(res);
    setHasRun(true);
  };

  const handleReset = () => {
    setInvestment(DEFAULT_INVESTMENT);
    setContributions([]);
    setAdvanced(DEFAULT_ADVANCED);
    setResult(null);
    setHasRun(false);
  };

  const canSimulate =
    investment.yearlyInterestRate > 0 &&
    investment.timeValue > 0;

  return (
    <section className="mx-auto max-w-3xl">
      <Link
        to="/simulador-metas"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft size={16} />
        Voltar
      </Link>

      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Juros Compostos
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Simule o crescimento de um investimento com aportes mensais e esporádicos.
        </p>
      </div>

      <div className="space-y-5">
        <InvestmentForm value={investment} onChange={setInvestment} />

        <EsporadicContributions
          contributions={contributions}
          totalMonths={totalMonths}
          onAdd={(c) => setContributions((prev) => [...prev, c])}
          onRemove={(id) =>
            setContributions((prev) => prev.filter((c) => c.id !== id))
          }
          onUpdate={(updated) =>
            setContributions((prev) =>
              prev.map((c) => (c.id === updated.id ? updated : c)),
            )
          }
        />

        <AdvancedSettings value={advanced} onChange={setAdvanced} />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSimulate}
            disabled={!canSimulate}
            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-sm font-medium text-white transition-colors hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
          >
            <Calculator size={18} />
            Simular
          </button>
          {hasRun && (
            <button
              type="button"
              onClick={handleReset}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <RotateCcw size={16} />
              Limpar
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className="mt-8">
          <SimulationResult result={result} />
        </div>
      )}
    </section>
  );
}
