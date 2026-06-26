import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { CategoryResponse } from "@/types/finance";
import { categoryApi } from "@/services/category";
import { getCategoryIcon } from "@/utils/categoryIcons";

interface CategoryPickerProps {
  value: string;
  categoryId?: string | null;
  onSelect: (categoryName: string, categoryId?: string | null) => void;
}

export function CategoryPicker({
  value,
  categoryId,
  onSelect,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [custom, setCustom] = useState(categoryId ? "" : value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCategory = useCallback(
    (cat: CategoryResponse) => {
      onSelect(cat.name, cat.id);
      setCustom("");
      setOpen(false);
    },
    [onSelect],
  );

  const handleCustomChange = useCallback(
    (val: string) => {
      setCustom(val);
      onSelect(val, null);
    },
    [onSelect],
  );

  const selectedCat = categories.find((c) => c.id === categoryId);

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
        Categoria
      </label>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mt-1 flex min-h-[48px] w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
      >
        {selectedCat ? (
          <>
            <span
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: selectedCat.color }}
            >
              {getCategoryIcon(selectedCat.icon, 14, "#fff")}
            </span>
            <span className="flex-1 text-left">{selectedCat.name}</span>
          </>
        ) : (
          <span className="flex-1 text-left text-slate-400">
            {value || "Selecione ou digite..."}
          </span>
        )}
        <ChevronDown size={16} className="shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-600 dark:bg-slate-800">
          <input
            type="text"
            value={custom}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="Digite personalizado..."
            autoComplete="off"
            className="mb-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500"
          />
          {categories.length === 0 && !custom && (
            <p className="px-3 py-4 text-center text-sm text-slate-400">
              Nenhuma categoria criada
            </p>
          )}
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectCategory(cat)}
              className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <span
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: cat.color }}
              >
                {getCategoryIcon(cat.icon, 16, "#fff")}
              </span>
              <span className="flex-1 text-left">{cat.name}</span>
              {cat.id === categoryId && (
                <Check size={16} className="shrink-0 text-emerald-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
