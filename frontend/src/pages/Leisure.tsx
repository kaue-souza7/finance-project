import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Inbox,
  MapPin,
  Plus,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card, CardTitle, CardValue } from "@/components/Card";
import { LeisureForm } from "@/components/LeisureForm";
import { ReceivedInvitesModal } from "@/components/ReceivedInvitesModal";
import { Skeleton, SkeletonCard } from "@/components/Skeleton";
import { Toast } from "@/components/Toast";
import { leisureApi } from "@/services/leisure";
import { leisureInviteApi } from "@/services/leisureInvite";
import { MONTHS } from "@/utils/date";
import type { LeisureResponse } from "@/types/finance";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

const parseDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export function Leisure() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<LeisureResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const [showInvites, setShowInvites] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const loadInviteCount = useCallback(async () => {
    try {
      const data = await leisureInviteApi.getReceived();
      setPendingCount(data.filter((i) => i.status === "pending").length);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadInviteCount();
  }, [loadInviteCount]);

  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await leisureApi.list();
      setEvents(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar lazeres");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInvitesUpdate = useCallback(() => {
    load();
    loadInviteCount();
  }, [load, loadInviteCount]);

  const handleFormSuccess = useCallback(() => {
    setToast({ message: "Lazer criado com sucesso!", variant: "success" });
    setShowForm(false);
    load();
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  const handlePrevMonth = () => {
    setSelectedDate(null);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDate(null);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const monthEvents = useMemo(
    () =>
      events.filter((e) => {
        const d = parseDate(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }),
    [events, currentMonth, currentYear],
  );

  const getEventsForDay = (day: number) =>
    monthEvents.filter((e) => parseDate(e.date).getDate() === day);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return days;
  }, [currentMonth, currentYear]);

  const selectedDayEvents = useMemo(
    () =>
      selectedDate
        ? events.filter((e) => {
            const d = parseDate(e.date);
            return (
              d.getDate() === selectedDate.getDate() &&
              d.getMonth() === selectedDate.getMonth() &&
              d.getFullYear() === selectedDate.getFullYear()
            );
          })
        : [],
    [selectedDate, events],
  );

  const summary = useMemo(() => {
    const parsed = events.map((e) => ({
      ...e,
      parsedDate: parseDate(e.date),
    }));

    const future = parsed
      .filter((e) => e.parsedDate >= today)
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    return {
      total: events.length,
      nextEvent: future[0] ?? null,
      totalBudget: events.reduce((s, e) => s + Number(e.budget ?? 0), 0),
    };
  }, [events, today]);

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-1">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-1 h-4 w-80" />
        </div>
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <Skeleton className="h-56 rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl lg:col-span-3" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Viagens & Lazer
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gerencie seus eventos de lazer, viagens e atividades.
          </p>
        </div>
        <Card>
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <AlertCircle size={28} className="text-rose-500" />
            <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <button
              onClick={load}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            >
              <RefreshCw size={14} />
              Tentar novamente
            </button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Viagens & Lazer
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Gerencie seus eventos de lazer, viagens e atividades.
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="relative flex items-start justify-between">
            <div>
              <CardTitle>Lazeres</CardTitle>
              <CardValue className="text-sky-600 dark:text-sky-400">
                {summary.total}
              </CardValue>
            </div>
            <div className="rounded-lg bg-sky-100 p-2 dark:bg-sky-900/30">
              <CalendarDays size={18} className="text-sky-600 dark:text-sky-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="relative flex items-start justify-between">
            <div>
              <CardTitle>Próximo lazer</CardTitle>
              <CardValue
                className={
                  summary.nextEvent
                    ? "text-emerald-600 dark:text-emerald-400"
                    : ""
                }
              >
                {summary.nextEvent
                  ? summary.nextEvent.parsedDate.toLocaleDateString(
                      "pt-BR",
                      { day: "numeric", month: "short" },
                    )
                  : "—"}
              </CardValue>
              {summary.nextEvent && (
                <p className="mt-0.5 max-w-[10rem] truncate text-xs text-slate-500 dark:text-slate-400">
                  {summary.nextEvent.title}
                </p>
              )}
            </div>
            <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
              <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="relative flex items-start justify-between">
            <div>
              <CardTitle>Valor previsto</CardTitle>
              <CardValue className="text-violet-600 dark:text-violet-400">
                {brl(summary.totalBudget)}
              </CardValue>
            </div>
            <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-900/30">
              <Wallet size={18} className="text-violet-600 dark:text-violet-400" />
            </div>
          </div>
        </Card>
      </div>

      {events.length === 0 ? (
        <Card className="mb-6">
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <CalendarDays
              size={40}
              className="text-slate-300 dark:text-slate-600"
            />
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Nenhum lazer registrado
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Crie seu primeiro evento de lazer ou viagem para começar.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowInvites(true)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <Inbox size={16} />
                Convites
                {pendingCount > 0 && (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                <Plus size={16} />
                Criar lazer
              </button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="mb-6 grid gap-6 lg:grid-cols-5">
            <Card className="flex flex-col items-center justify-center gap-5 py-10 text-center lg:col-span-2">
              <div className="rounded-xl bg-gradient-to-br from-sky-100 to-sky-50 p-4 dark:from-sky-900/40 dark:to-sky-800/20">
                <Plus size={32} className="text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Criar novo lazer
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Crie e organize seu próximo evento de lazer ou viagem.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowInvites(true)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Inbox size={16} />
                  Convites
                  {pendingCount > 0 && (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-slate-900 px-6 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  <Plus size={16} />
                  Criar lazer
                </button>
              </div>
            </Card>

            <div className="lg:col-span-3">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                  <button
                    onClick={handlePrevMonth}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-700 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                    aria-label="Mês anterior"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white select-none">
                    {MONTHS[currentMonth]} {currentYear}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-700 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                    aria-label="Próximo mês"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700">
                  {WEEKDAYS.map((d) => (
                    <div
                      key={d}
                      className="py-2 text-center text-xs font-medium text-slate-400 dark:text-slate-500"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {calendarDays.map((day, i) => {
                    if (day === null) {
                      return <div key={`e-${i}`} />;
                    }

                    const dayEvents = getEventsForDay(day);
                    const hasEvent = dayEvents.length > 0;
                    const isSelected =
                      selectedDate?.getDate() === day &&
                      selectedDate?.getMonth() === currentMonth &&
                      selectedDate?.getFullYear() === currentYear;

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          setSelectedDate(
                            new Date(currentYear, currentMonth, day),
                          )
                        }
                        className={`group relative flex flex-col items-center justify-center py-2 text-sm transition-all duration-150 ${
                          isSelected
                            ? "bg-sky-50 dark:bg-sky-900/20"
                            : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all duration-150 ${
                            isSelected
                              ? "bg-sky-500 font-semibold text-white shadow-sm shadow-sky-200 dark:shadow-sky-900"
                              : isToday(day)
                                ? "bg-slate-900 font-semibold text-white dark:bg-white dark:text-slate-900"
                                : "text-slate-700 transition-colors group-hover:scale-110 dark:text-slate-300"
                          }`}
                        >
                          {day}
                        </span>
                        {hasEvent && (
                          <span className="mt-0.5 h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-500" />
                        )}
                        {hasEvent && (
                          <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-lg transition-opacity group-hover:block dark:border-slate-600 dark:bg-slate-800">
                            <p className="whitespace-nowrap font-medium text-slate-900 dark:text-white">
                              {dayEvents[0].title}
                            </p>
                            {dayEvents.length > 1 && (
                              <p className="text-slate-500 dark:text-slate-400">
                                +{dayEvents.length - 1} mais
                              </p>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {selectedDate && selectedDayEvents.length > 0 && (
            <div className="mb-6 animate-fade-in">
              <div className="mb-3 flex items-center gap-2">
                <CalendarDays size={16} className="text-slate-400" />
                <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {selectedDate.toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  — {selectedDayEvents.length}{" "}
                  {selectedDayEvents.length === 1 ? "evento" : "eventos"}
                </h2>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {selectedDayEvents.map((event, idx) => {
                  const location = [event.location_name, event.location_address]
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <Card
                      key={event.id}
                      className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                      style={{ animationDelay: `${idx * 80}ms` }}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                            {event.title}
                          </h3>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize transition-all ${
                              event.status === "confirmed"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : event.status === "completed"
                                  ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                                  : event.status === "cancelled"
                                    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            }`}
                          >
                            {event.status === "planning"
                              ? "planejando"
                              : event.status === "confirmed"
                                ? "confirmado"
                                : event.status === "completed"
                                  ? "realizado"
                                  : event.status === "cancelled"
                                    ? "cancelado"
                                    : event.status}
                          </span>
                        </div>

                        {event.description && (
                          <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                            {event.description}
                          </p>
                        )}

                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Wallet
                              size={14}
                              className="shrink-0 text-violet-500"
                            />
                            <span>
                              {event.budget
                                ? `Orçamento: ${brl(Number(event.budget))}`
                                : "Sem orçamento"}
                            </span>
                          </div>
                          {location && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <MapPin
                                size={14}
                                className="shrink-0 text-sky-500"
                              />
                              <span>{location}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-5 flex gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/leisure/${event.id}`)}
                            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition-all duration-200 hover:bg-slate-800 hover:shadow-md active:scale-[0.97] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                          >
                            Acessar lazer
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {selectedDate && selectedDayEvents.length === 0 && (
            <Card className="mb-6">
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CalendarDays
                  size={32}
                  className="text-slate-300 dark:text-slate-600"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Nenhum evento neste dia
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {selectedDate.toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  <Plus size={14} />
                  Criar evento
                </button>
              </div>
            </Card>
          )}
        </>
      )}

      <LeisureForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleFormSuccess}
      />

      <ReceivedInvitesModal
        open={showInvites}
        onClose={() => setShowInvites(false)}
        onUpdate={handleInvitesUpdate}
      />

      <Toast
        open={toast !== null}
        message={toast?.message ?? ""}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />
    </section>
  );
}
