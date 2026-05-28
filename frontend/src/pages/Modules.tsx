import { MessageSquareText, Plane } from "lucide-react";
import { ModuleCard } from "@/components/ModuleCard";

const modules = [
  {
    icon: Plane,
    title: "Viagens & Lazer",
    description:
      "Controle e planejamento de gastos com viagens e atividades de lazer.",
    comingSoon: false,
    to: "/leisure",
  },
  {
    icon: MessageSquareText,
    title: "Finance Chat",
    description:
      "Converse com outros usuários sobre finanças com mensagens privadas.",
    comingSoon: false,
    to: "/chat",
  },
];

export function Modules() {
  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Outros módulos
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Módulos adicionais para expandir o controle das suas finanças.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => (
          <ModuleCard
            key={mod.title}
            icon={mod.icon}
            title={mod.title}
            description={mod.description}
            comingSoon={mod.comingSoon}
            to={mod.to}
          />
        ))}
      </div>
    </section>
  );
}
