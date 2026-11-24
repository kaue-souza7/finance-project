import { useEffect, useRef, useState } from "react";
import { Loader2, NotebookPen, Wallet, X } from "lucide-react";
import { MoneyInput } from "@/components/additionalOrganization/MoneyInput";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { additionalOrganizationApi } from "@/services/additionalOrganization";
import {
  centsToEditableInput,
  organizationTypeLabel,
} from "@/utils/additionalOrganization";
import {
  centsToDecimalString,
  decimalStringToCents,
  parseBrlToCents,
} from "@/utils/format";
import type {
  AdditionalOrganizationSummary,
  AdditionalOrganizationType,
} from "@/types/additionalOrganization";

interface OrganizationFormSheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (organization: AdditionalOrganizationSummary) => void;
  initial?: AdditionalOrganizationSummary | null;
}

export function OrganizationFormSheet({
  open,
  onClose,
  onSuccess,
  initial,
}: OrganizationFormSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, panelRef);

  const [title, setTitle] = useState("");
  const [type, setType] =
    useState<AdditionalOrganizationType>("free_text");
  const [totalAmount, setTotalAmount] = useState("");
  const [showObservations, setShowObservations] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (initial) {
      setTitle(initial.title);
      setType(initial.type);
      setTotalAmount(
        initial.total_amount
          ? centsToEditableInput(
              decimalStringToCents(initial.total_amount),
            )
          : "",
      );
      setShowObservations(initial.show_observations);
    } else {
      setTitle("");
      setType("free_text");
      setTotalAmount("");
      setShowObservations(false);
    }
    setError(null);
    setFieldError(null);
    setLoading(false);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onClose]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setFieldError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFieldError("Informe um título.");
      return;
    }

    let totalCents: number | null = null;
    if (type === "additional_income") {
      totalCents = parseBrlToCents(totalAmount);
      if (totalCents === null || totalCents <= 0) {
        setFieldError(
          "Informe um valor maior que zero, com até 2 casas decimais.",
        );
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        title: trimmedTitle,
        type,
        total_amount:
          type === "additional_income" && totalCents !== null
            ? centsToDecimalString(totalCents)
            : null,
        show_observations:
          type === "additional_income" ? showObservations : false,
      };

      const saved = initial
        ? await additionalOrganizationApi.update(initial.id, {
            title: trimmedTitle,
            ...(initial.type === "additional_income" &&
            totalCents !== null
              ? { total_amount: centsToDecimalString(totalCents) }
              : {}),
            show_observations:
              initial.type === "additional_income"
                ? showObservations
                : false,
          })
        : await additionalOrganizationApi.create(payload);

      onSuccess(saved);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar a organização.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="organization-form-title"
        tabIndex={-1}
        className="flex max-h-[90dvh] w-full flex-col rounded-t-2xl border border-slate-200 bg-white shadow-xl outline-none dark:border-slate-700 dark:bg-slate-800 sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h2
            id="organization-form-title"
            className="text-base font-semibold text-slate-900 dark:text-white"
          >
            {initial ? "Editar organização" : "Nova organização"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <form
          id="organization-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto overscroll-contain px-5 py-4"
          noValidate
        >
          <div className="space-y-5">
            <div>
              <span className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Tipo de organização
              </span>

              {initial ? (
                <div className="flex min-h-[48px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-600 dark:bg-slate-700/40">
                  {initial.type === "free_text" ? (
                    <NotebookPen
                      size={20}
                      className="text-violet-600 dark:text-violet-400"
                    />
                  ) : (
                    <Wallet
                      size={20}
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                  )}
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {organizationTypeLabel(initial.type)}
                  </span>
                  <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                    Tipo fixo
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setType("free_text");
                      setFieldError(null);
                    }}
                    aria-pressed={type === "free_text"}
                    className={`flex min-h-[76px] items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                      type === "free_text"
                        ? "border-violet-500 bg-violet-50 ring-2 ring-violet-500/20 dark:border-violet-400 dark:bg-violet-900/20"
                        : "border-slate-200 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700/40"
                    }`}
                  >
                    <NotebookPen
                      size={20}
                      className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-400"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                        Texto Livre
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">
                        Anotações e observações sem valores.
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setType("additional_income");
                      setFieldError(null);
                    }}
                    aria-pressed={type === "additional_income"}
                    className={`flex min-h-[76px] items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                      type === "additional_income"
                        ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20 dark:border-emerald-400 dark:bg-emerald-900/20"
                        : "border-slate-200 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700/40"
                    }`}
                  >
                    <Wallet
                      size={20}
                      className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                        Receita Adicional
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">
                        Distribua uma receita extra entre destinos.
                      </span>
                    </span>
                  </button>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="organization-title"
                className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Título
              </label>
              <input
                id="organization-title"
                type="text"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setFieldError(null);
                }}
                placeholder={
                  type === "free_text"
                    ? "Ex: Planejamento de dezembro"
                    : "Ex: Décimo terceiro 2026"
                }
                maxLength={255}
                autoComplete="off"
                className="min-h-[48px] w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
              />
            </div>

            {type === "additional_income" && (
              <>
                <div>
                  <label
                    htmlFor="organization-total"
                    className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400"
                  >
                    Valor da receita adicional (R$)
                  </label>
                  <MoneyInput
                    id="organization-total"
                    value={totalAmount}
                    onChange={(value) => {
                      setTotalAmount(value);
                      setFieldError(null);
                    }}
                    error={fieldError}
                    ariaDescribedBy={
                      fieldError ? "organization-form-error" : undefined
                    }
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    Ex: 5.000,00
                  </p>
                </div>

                <label className="flex min-h-[52px] cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-600">
                  <input
                    type="checkbox"
                    checked={showObservations}
                    onChange={(event) =>
                      setShowObservations(event.target.checked)
                    }
                    className="mt-0.5 h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 dark:border-slate-500 dark:bg-slate-700"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                      Incluir coluna de observações
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">
                      Mostra um campo extra em cada linha da distribuição.
                    </span>
                  </span>
                </label>
              </>
            )}

            {fieldError && (
              <p
                id="organization-form-error"
                role="alert"
                className="text-sm text-rose-600 dark:text-rose-400"
              >
                {fieldError}
              </p>
            )}
            {error && (
              <p
                role="alert"
                className="text-sm text-rose-600 dark:text-rose-400"
              >
                {error}
              </p>
            )}
          </div>
        </form>

        <div className="border-t border-slate-200 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] dark:border-slate-700">
          <button
            type="submit"
            form="organization-form"
            disabled={loading || !title.trim()}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {initial ? "Salvar alterações" : "Criar organização"}
          </button>
        </div>
      </div>
    </div>
  );
}
