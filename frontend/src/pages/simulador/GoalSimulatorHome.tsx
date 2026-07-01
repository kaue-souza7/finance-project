import { ChartLine, PiggyBank, Wallet } from "lucide-react";
import { SimulatorOptionCard } from "@/components/SimulatorOptionCard";

const options = [
  {
    icon: ChartLine,
    title: "Juros Compostos",
    description:
      "Simule o crescimento de um investimento utilizando juros compostos.",
    to: "/simulador-metas/juros-compostos",
  },
  {
    icon: PiggyBank,
    title: "Acumular Patrimônio",
    description:
      "Descubra quanto investir por mês para atingir um patrimônio desejado.",
    to: "/simulador-metas/acumular-patrimonio",
  },
  {
    icon: Wallet,
    title: "Renda Passiva",
    description:
      "Calcule quanto patrimônio é necessário para gerar uma renda mensal.",
    to: "/simulador-metas/renda-passiva",
  },
];

export function GoalSimulatorHome() {
  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-col gap-1 sm:mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Simulador de Metas
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Escolha uma calculadora para iniciar sua simulação.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((opt, idx) => (
          <div
            key={opt.title}
            className="animate-fade-in"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <SimulatorOptionCard
              icon={opt.icon}
              title={opt.title}
              description={opt.description}
              to={opt.to}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
