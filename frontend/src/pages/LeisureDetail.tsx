import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  MapPin,
  Plus,
  RefreshCw,
  Route,
  Trash2,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { Card, CardTitle, CardValue } from "@/components/Card";
import { LeisureExpenseForm } from "@/components/LeisureExpenseForm";
import { LeisureMap } from "@/components/LeisureMap";
import { LeisureParticipantsPanel } from "@/components/LeisureParticipantsPanel";
import { KmCalculator } from "@/components/KmCalculator";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";

import { leisureApi } from "@/services/leisure";
import { leisureExpenseApi } from "@/services/leisureExpense";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { LeisureExpenseResponse, LeisureResponse } from "@/types/finance";

type Tab = "overview" | "expenses" | "km" | "participants";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Visão Geral" },
  { key: "expenses", label: "Despesas" },
  { key: "km", label: "KM" },
  { key: "participants", label: "Participantes" },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  planning: {
    label: "Planejando",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  confirmed: {
    label: "Confirmado",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  completed: {
    label: "Realizado",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
  },
  cancelled: {
    label: "Cancelado",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  },
};

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

const parseDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const formatDate = (dateStr: string) => {
  const d = parseDate(dateStr);
  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export function LeisureDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast: showToast } = useToast();

  const [event, setEvent] = useState<LeisureResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const [expenses, setExpenses] = useState<LeisureExpenseResponse[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);


  const loadExpenses = useCallback(async () => {
    if (!id) return;
    setExpensesLoading(true);
    setExpensesError(null);
    try {
      const data = await leisureExpenseApi.list(id);
      setExpenses(data);
    } catch (e) {
      setExpensesError(e instanceof Error ? e.message : "Erro ao carregar despesas");
    } finally {
      setExpensesLoading(false);
    }
  }, [id]);

  const handleDeleteEvent = useCallback(async () => {
    if (!id) return;
    setDeletingEvent(true);
    try {
      await leisureApi.delete(id);
      showToast("Lazer excluído com sucesso!", "success");
      navigate("/leisure", { replace: true });
    } catch {
      showToast("Erro ao excluir lazer", "error");
      setConfirmDelete(false);
    } finally {
      setDeletingEvent(false);
    }
  }, [id, navigate, showToast]);

  const handleTogglePaid = useCallback(
    async (expense: LeisureExpenseResponse) => {
      try {
        const updated = await leisureExpenseApi.update(id!, expense.id, {
          paid: !expense.paid,
        });
        setExpenses((prev) =>
          prev.map((e) => (e.id === updated.id ? updated : e)),
        );
      } catch {
        showToast("Erro ao atualizar despesa", "error");
      }
    },
    [id],
  );

  const handleDelete = useCallback(
    async (expenseId: string) => {
      setDeletingId(expenseId);
      try {
        await leisureExpenseApi.delete(id!, expenseId);
        setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
      } catch {
        showToast("Erro ao excluir despesa", "error");
      } finally {
        setDeletingId(null);
      }
    },
    [id],
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((acc, e) => acc + Number(e.amount), 0),
    [expenses],
  );

  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await leisureApi.getById(id);
      setEvent(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar lazer");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (id) {
      loadExpenses();
    }
  }, [id, loadExpenses]);

  const countdown = useMemo(() => {
    if (!event) return null;
    const eventDate = parseDate(event.date);
    const diff = eventDate.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: "Já ocorreu", type: "past" as const };
    if (days === 0) return { text: "Hoje!", type: "today" as const };
    if (days === 1) return { text: "Amanhã!", type: "future" as const };
    return { text: `Faltam ${days} dias`, type: "future" as const };
  }, [event, today]);

  const location = useMemo(() => {
    if (!event) return null;
    return [event.location_name, event.location_address]
      .filter(Boolean)
      .join(", ");
  }, [event]);

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl">
        <Skeleton className="mb-4 h-5 w-20" />
        <Skeleton className="mb-6 h-9 w-96" />
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="mt-6 h-72 w-full rounded-xl" />
      </section>
    );
  }

  if (error || !event) {
    return (
      <section className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
        <Card>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <AlertCircle size={28} className="text-rose-500" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {error ?? "Lazer não encontrado"}
            </p>
            <button
              onClick={load}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700"
            >
              <RefreshCw size={14} />
              Tentar novamente
            </button>
          </div>
        </Card>
      </section>
    );
  }

  const status = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.planning;
  const budget = event.budget ? Number(event.budget) : 0;
  const isOwner = user?.id === event.owner_id;

  return (
    <section className="mx-auto max-w-6xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {event.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={16} className="shrink-0" />
                {formatDate(event.date)}
              </span>
              {location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={16} className="shrink-0" />
                  <span className="max-w-[20rem] truncate">{location}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span
              className={`inline-flex animate-scale-in items-center rounded-full px-3 py-1 text-xs font-medium shadow-sm ${status.className}`}
            >
              {status.label}
            </span>
            {countdown && (
              <span
                className={`inline-flex animate-slide-up items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                  countdown.type === "past"
                    ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    : countdown.type === "today"
                      ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                }`}
              >
                <Clock size={14} className="shrink-0" />
                {countdown.text}
              </span>
            )}

            {isOwner && (
              <div className="mt-2 w-full border-t border-slate-200 pt-3 dark:border-slate-700">
                {confirmDelete ? (
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs leading-relaxed text-rose-600 dark:text-rose-400">
                      Excluir este lazer permanentemente?
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        disabled={deletingEvent}
                        className="inline-flex min-h-[36px] items-center rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleDeleteEvent}
                        disabled={deletingEvent}
                        className="inline-flex min-h-[36px] items-center rounded-lg bg-rose-500 px-3 text-xs font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
                      >
                        {deletingEvent ? "Excluindo..." : "Sim, excluir"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-500 transition-colors hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300"
                  >
                    <Trash2 size={13} />
                    Excluir lazer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="relative flex items-start justify-between">
            <div>
              <CardTitle>Orçamento</CardTitle>
              <CardValue className="text-violet-600 dark:text-violet-400">
                {budget > 0 ? brl(budget) : "—"}
              </CardValue>
            </div>
            <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-900/30">
              <DollarSign size={18} className="text-violet-600 dark:text-violet-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="relative flex items-start justify-between">
            <div>
              <CardTitle>Gasto atual</CardTitle>
              <CardValue className="text-amber-600 dark:text-amber-400">
                {totalExpenses > 0 ? brl(totalExpenses) : "—"}
              </CardValue>
            </div>
            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
              <TrendingUp size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="relative flex items-start justify-between">
            <div>
              <CardTitle>KM estimado</CardTitle>
              <CardValue className="text-sky-600 dark:text-sky-400">
                —
              </CardValue>
            </div>
            <div className="rounded-lg bg-sky-100 p-2 dark:bg-sky-900/30">
              <Route size={18} className="text-sky-600 dark:text-sky-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="relative flex items-start justify-between">
            <div>
              <CardTitle>Participantes</CardTitle>
              <CardValue className="text-emerald-600 dark:text-emerald-400">
                {event.participant_count}
              </CardValue>
            </div>
            <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
              <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-6 animate-fade-in">
        <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative whitespace-nowrap px-5 py-3 text-sm font-medium transition-colors duration-150 ${
                activeTab === tab.key
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-900 dark:bg-white" />
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "overview" && (
        <div key="overview" className="animate-slide-up">
          <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            {event.description && (
              <Card>
                <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                  Descrição
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {event.description}
                </p>
              </Card>
            )}

            {event.latitude != null && event.longitude != null && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                  Localização
                </h3>
                <LeisureMap
                  latitude={event.latitude}
                  longitude={event.longitude}
                  locationName={event.location_name ?? undefined}
                />
                {location && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <MapPin size={14} />
                    {location}
                  </p>
                )}
              </div>
            )}

            {!event.description && (
              <Card>
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <AlertCircle
                    size={24}
                    className="text-slate-300 dark:text-slate-600"
                  />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Nenhuma descrição adicionada.
                  </p>
                </div>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2">
            <Card>
              <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
                Resumo Financeiro
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">
                    Orçamento
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {budget > 0 ? brl(budget) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">
                    Gasto atual
                  </span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    {totalExpenses > 0 ? brl(totalExpenses) : "—"}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Restante
                    </span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {budget > 0 ? brl(Math.max(0, budget - totalExpenses)) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
          </div>
      )}

      {activeTab === "expenses" && (
        <div key="expenses" className="animate-slide-up">
          <>
            {expenses.length === 0 && !expensesLoading && !expensesError && (
            <Card>
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <DollarSign
                  size={40}
                  className="text-slate-300 dark:text-slate-600"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Nenhuma despesa
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Adicione a primeira despesa deste lazer.
                  </p>
                </div>
                <button
                  onClick={() => setShowExpenseForm(true)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700"
                >
                  <Plus size={16} />
                  Nova despesa
                </button>
              </div>
            </Card>
          )}

          {expensesLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {expensesError && (
            <Card>
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <AlertCircle size={24} className="text-rose-500" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {expensesError}
                </p>
                <button
                  onClick={loadExpenses}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700"
                >
                  <RefreshCw size={14} />
                  Tentar novamente
                </button>
              </div>
            </Card>
          )}

          {!expensesLoading && !expensesError && expenses.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {expenses.length}{" "}
                  {expenses.length === 1 ? "despesa" : "despesas"} —
                  total{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {brl(totalExpenses)}
                  </strong>
                </span>
                <button
                  onClick={() => setShowExpenseForm(true)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700"
                >
                  <Plus size={16} />
                  Nova despesa
                </button>
              </div>

              {categoryTotals.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {categoryTotals.map(([cat, val]) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    >
                      {cat}: {brl(val)}
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {expenses.map((expense, idx) => (
                  <Card
                    key={expense.id}
                    className="group animate-slide-up-stagger transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleTogglePaid(expense)}
                        className="mt-0.5 shrink-0 transition-transform duration-150 active:scale-110"
                        title={expense.paid ? "Marcar como não pago" : "Marcar como pago"}
                      >
                        {expense.paid ? (
                          <CheckCircle2
                            size={20}
                            className="text-emerald-500 transition-all duration-200"
                          />
                        ) : (
                          <XCircle
                            size={20}
                            className="text-slate-300 transition-all duration-200 hover:text-slate-400 dark:text-slate-600 dark:hover:text-slate-500"
                          />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-medium ${
                                expense.paid
                                  ? "text-slate-400 line-through dark:text-slate-500"
                                  : "text-slate-900 dark:text-white"
                              }`}
                            >
                              {expense.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              {expense.category}
                              {expense.description && (
                                <> &middot; {expense.description}</>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`whitespace-nowrap text-sm font-semibold ${
                                expense.paid
                                  ? "text-slate-400 dark:text-slate-500"
                                  : "text-slate-900 dark:text-white"
                              }`}
                            >
                              {brl(Number(expense.amount))}
                            </span>
                            <button
                              onClick={() => handleDelete(expense.id)}
                              disabled={deletingId === expense.id}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 opacity-0 transition-all duration-150 hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 disabled:opacity-50 dark:hover:bg-rose-900/20"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <LeisureExpenseForm
            leisureId={id!}
            open={showExpenseForm}
            onClose={() => setShowExpenseForm(false)}
            onSuccess={() => {
              loadExpenses();
            }}
          />
        </>
          </div>
        )}

      {activeTab === "km" && id && (
        <div key="km" className="animate-slide-up">
          <KmCalculator leisureId={id} />
        </div>
      )}

      {activeTab === "participants" && id && (
        <div key="participants" className="animate-slide-up">
          <LeisureParticipantsPanel leisureId={id} />
        </div>
      )}


    </section>
  );
}
