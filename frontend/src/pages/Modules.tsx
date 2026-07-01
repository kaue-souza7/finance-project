import { ClipboardCheck, MessageSquareText, Plane, Target } from "lucide-react";
import { ModuleCube } from "@/components/ModuleCube";
import { ModuleCubeProvider } from "@/components/ModuleCubeContext";

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
  {
    icon: ClipboardCheck,
    title: "CheckList de Mercado",
    description:
      "Crie e gerencie listas de compras do mercado.",
    comingSoon: false,
    to: "/checklist",
  },
  {
    icon: Target,
    title: "Simulador de Metas",
    description:
      "Simule objetivos financeiros, patrimônio, renda passiva e metas de investimento.",
    comingSoon: true,
  },
];

export function Modules() {
  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-12 flex flex-col gap-1 sm:mb-16 lg:mb-20">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Outros módulos
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Módulos adicionais para expandir o controle das suas finanças.
        </p>
      </div>

      <ModuleCubeProvider>
        <div className="grid gap-x-4 gap-y-20 sm:gap-y-8 lg:gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <ModuleCube
              key={mod.title}
              icon={mod.icon}
              title={mod.title}
              description={mod.description}
              comingSoon={mod.comingSoon}
              to={mod.to}
            />
          ))}
        </div>
      </ModuleCubeProvider>
    </section>
  );
}
