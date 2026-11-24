import { LayoutGrid, List, Search, X } from "lucide-react";
import type { OrganizationViewMode } from "@/hooks/useOrganizationViewMode";

interface OrganizationToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  viewMode: OrganizationViewMode;
  onViewModeChange: (mode: OrganizationViewMode) => void;
  count: number;
}

export function OrganizationToolbar({
  query,
  onQueryChange,
  viewMode,
  onViewModeChange,
  count,
}: OrganizationToolbarProps) {
  return (
    <div className="mb-5 rounded-xl border border-slate-200 bg-white p-3 shadow-brand-sm dark:border-slate-700 dark:bg-slate-800/50">
      <label htmlFor="organization-search" className="sr-only">
        Pesquisar organizações
      </label>
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          id="organization-search"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Pesquisar organizações..."
          autoComplete="off"
          className="min-h-[48px] w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-10 pr-12 text-base text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:bg-slate-800 dark:focus:ring-indigo-400/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            aria-label="Limpar pesquisa"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p
          className="text-xs font-medium text-slate-500 dark:text-slate-400"
          role="status"
          aria-live="polite"
        >
          {count} {count === 1 ? "organização" : "organizações"}
        </p>

        <div
          className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-600 dark:bg-slate-800"
          role="group"
          aria-label="Formato de visualização"
        >
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            aria-pressed={viewMode === "grid"}
            aria-label="Visualizar em blocos"
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${
              viewMode === "grid"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <LayoutGrid size={17} />
            <span className="hidden min-[380px]:inline">Blocos</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            aria-pressed={viewMode === "list"}
            aria-label="Visualizar em lista"
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${
              viewMode === "list"
                ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <List size={17} />
            <span className="hidden min-[380px]:inline">Lista</span>
          </button>
        </div>
      </div>
    </div>
  );
}
