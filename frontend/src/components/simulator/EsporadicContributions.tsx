import { useState } from "react";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import type { EsporadicContribution, ContributionType } from "@/types/simulator";
import { formatBrl } from "@/utils/format";

const MONTHS_OF_YEAR = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface EsporadicContributionsProps {
  contributions: EsporadicContribution[];
  totalMonths: number;
  onAdd: (c: EsporadicContribution) => void;
  onRemove: (id: string) => void;
  onUpdate: (c: EsporadicContribution) => void;
}

function inputCls() {
  return "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20";
}

function labelCls() {
  return "text-sm font-medium text-slate-700 dark:text-slate-300";
}

export function EsporadicContributions({
  contributions,
  totalMonths,
  onAdd,
  onRemove,
  onUpdate,
}: EsporadicContributionsProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formType, setFormType] = useState<ContributionType>("unique");
  const [formValue, setFormValue] = useState("");
  const [formPeriod, setFormPeriod] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const resetForm = () => {
    setFormType("unique");
    setFormValue("");
    setFormPeriod("");
    setFormDescription("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (c: EsporadicContribution) => {
    setFormType(c.type);
    setFormValue(String(c.value));
    setFormPeriod(String(c.period));
    setFormDescription(c.description);
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    const val = Number(formValue);
    const period = Number(formPeriod);
    if (!val || val <= 0 || !period || period <= 0) return;

    if (editingId) {
      onUpdate({
        id: editingId,
        type: formType,
        value: val,
        period,
        description: formDescription,
      });
    } else {
      onAdd({
        id: crypto.randomUUID(),
        type: formType,
        value: val,
        period,
        description: formDescription,
      });
    }
    resetForm();
  };

  const periodLabel = (c: EsporadicContribution) => {
    if (c.type === "unique") {
      const monthOfYear = ((c.period - 1) % 12) + 1;
      const year = Math.ceil(c.period / 12);
      return `Mês ${c.period} (${MONTHS_OF_YEAR[monthOfYear - 1]}/${year})`;
    }
    return MONTHS_OF_YEAR[c.period - 1] ?? `Mês ${c.period}`;
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-brand-sm dark:border-slate-700 dark:bg-slate-800/50 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Aportes Esporádicos
        </h2>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancelar" : "Adicionar"}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-800/30">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls()}>Tipo</label>
              <select
                className={`${inputCls()} mt-1`}
                value={formType}
                onChange={(e) => setFormType(e.target.value as ContributionType)}
              >
                <option value="unique">Único</option>
                <option value="recurring">Recorrente</option>
              </select>
            </div>

            <div>
              <label className={labelCls()}>Valor</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                placeholder="0,00"
                className={`${inputCls()} mt-1`}
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
              />
            </div>

            <div>
              <label className={labelCls()}>
                {formType === "unique" ? `Mês da Simulação (1 a ${totalMonths})` : "Mês do Ano"}
              </label>
              {formType === "unique" ? (
                <input
                  type="number"
                  step="1"
                  min="1"
                  max={totalMonths}
                  inputMode="numeric"
                  placeholder={`1 a ${totalMonths}`}
                  className={`${inputCls()} mt-1`}
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                />
              ) : (
                <select
                  className={`${inputCls()} mt-1`}
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                >
                  <option value="">Selecionar</option>
                  {MONTHS_OF_YEAR.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className={labelCls()}>Descrição (opcional)</label>
              <input
                type="text"
                placeholder="Ex: 13º salário"
                className={`${inputCls()} mt-1`}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!formValue || Number(formValue) <= 0 || !formPeriod || Number(formPeriod) <= 0}
            className="mt-3 flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 sm:w-auto sm:px-6"
          >
            <Plus size={16} />
            {editingId ? "Salvar" : "Adicionar Aporte"}
          </button>
        </div>
      )}

      {contributions.length === 0 ? (
        <p className="py-2 text-center text-sm text-slate-400 dark:text-slate-500">
          {showForm ? "" : "Nenhum aporte esporádico cadastrado. Clique em Adicionar para incluir."}
        </p>
      ) : (
        <ul className="space-y-2">
          {contributions.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800/30"
            >
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {formatBrl(c.value)}
                </span>
                <span className="mx-2 text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {c.type === "unique" ? "Único" : "Recorrente"} — {periodLabel(c)}
                </span>
                {c.description && (
                  <>
                    <span className="mx-2 text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {c.description}
                    </span>
                  </>
                )}
              </div>
              <div className="ml-3 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleEdit(c)}
                  className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(c.id)}
                  className="rounded p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
