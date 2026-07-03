import { useCallback, useEffect, useState } from "react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PlanningForm } from "@/components/PlanningForm";
import { useToast } from "@/contexts/ToastContext";
import { Card, CardTitle, CardValue } from "@/components/Card";
import { SkeletonCard } from "@/components/Skeleton";
import { planningApi } from "@/services/planning";
import type { PlanningCreate, PlanningResponse, PlanningUpdate } from "@/types/finance";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatBRL(value: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function nextMonth(month: number, year: number) {
  return month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year };
}

export function Plannings() {
  const [plans, setPlans] = useState<PlanningResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [copyTarget, setCopyTarget] = useState<{
    month: number;
    year: number;
  } | null>(null);
  const [copying, setCopying] = useState(false);
  const { toast: showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await planningApi.list();
      setPlans(data);
    } catch {
      showToast("Erro ao carregar planejamentos", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (data: PlanningCreate | PlanningUpdate) => {
    setSaving(true);
    try {
      await planningApi.create(data as PlanningCreate);
      showToast("Planejamento criado com sucesso", "success");
      setShowForm(false);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao criar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data: PlanningCreate | PlanningUpdate) => {
    if (!editId) return;
    setSaving(true);
    try {
      await planningApi.update(editId, data as PlanningUpdate);
      showToast("Planejamento atualizado", "success");
      setEditId(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao atualizar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await planningApi.delete(id);
      showToast("Planejamento excluído", "success");
      load();
    } catch {
      showToast("Erro ao excluir", "error");
    }
  };

  const handleCopy = async () => {
    if (!copyTarget) return;
    setCopying(true);
    try {
      await planningApi.copyFromPrevious(copyTarget.month, copyTarget.year);
      showToast("Planejamento copiado com sucesso", "success");
      setCopyTarget(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao copiar", "error");
    } finally {
      setCopying(false);
    }
  };

  const editPlan = editId ? plans.find((p) => p.id === editId) : null;

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Planejamentos
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Gerencie seus planejamentos mensais.
          </p>
        </div>
        <button
          onClick={() => {
            setEditId(null);
            setShowForm(!showForm);
          }}
          className="flex min-h-[44px] items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700"
        >
          <Plus size={18} />
          Novo
        </button>
      </div>

      {(showForm || editId) && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            {editId ? "Editar planejamento" : "Novo planejamento"}
          </h2>
          <PlanningForm
            onSubmit={editId ? handleUpdate : handleCreate}
            initial={
              editPlan
                ? {
                    month: editPlan.month,
                    year: editPlan.year,
                    expected_revenue: Number(editPlan.expected_revenue),
                    expected_expenses: Number(editPlan.expected_expenses),
                    planned_investment: Number(editPlan.planned_investment),
                  }
                : undefined
            }
            loading={saving}
          />
        </div>
      )}

      <div className="space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))
          : plans.length === 0
            ? (
                <Card>
                  <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    Nenhum planejamento encontrado. Crie o primeiro.
                  </p>
                </Card>
              )
            : plans.map((plan) => {
                const next = nextMonth(plan.month, plan.year);
                return (
                  <Card key={plan.id}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {MONTHS[plan.month - 1]} {plan.year}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span>
                            Receita:{" "}
                            <strong className="text-emerald-600 dark:text-emerald-400">
                              {formatBRL(plan.expected_revenue)}
                            </strong>
                          </span>
                          <span>
                            Despesas:{" "}
                            <strong className="text-rose-600 dark:text-rose-400">
                              {formatBRL(plan.expected_expenses)}
                            </strong>
                          </span>
                          <span>
                            Investimento:{" "}
                            <strong className="text-sky-600 dark:text-sky-400">
                              {formatBRL(plan.planned_investment)}
                            </strong>
                          </span>
                        </div>
                        <CardTitle>Saldo restante</CardTitle>
                        <CardValue>{formatBRL(plan.remaining_balance)}</CardValue>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            setCopyTarget({ month: next.month, year: next.year })
                          }
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                          aria-label="Copiar para próximo mês"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEditId(plan.id);
                            setShowForm(false);
                          }}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                          aria-label="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                          aria-label="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
      </div>

      <ConfirmDialog
        open={!!copyTarget}
        title="Copiar para o próximo mês"
        message={
          copyTarget
            ? `Os dados deste planejamento serão copiados para ${
                MONTHS[copyTarget.month - 1]
              } de ${copyTarget.year}. Você poderá editá-los depois.`
            : ""
        }
        loading={copying}
        onConfirm={handleCopy}
        onCancel={() => setCopyTarget(null)}
      />


    </section>
  );
}
