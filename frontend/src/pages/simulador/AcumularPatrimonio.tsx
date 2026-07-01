import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export function AcumularPatrimonio() {
  return (
    <section className="mx-auto max-w-3xl">
      <Link
        to="/simulador-metas"
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft size={16} />
        Voltar
      </Link>

      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Acumular Patrimônio
        </h1>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/50 py-16 text-center dark:border-slate-600 dark:bg-slate-800/30">
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          Em desenvolvimento
        </p>
      </div>
    </section>
  );
}
