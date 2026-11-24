import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { MoneyInput } from "@/components/additionalOrganization/MoneyInput";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { ApiError } from "@/services/api";
import { additionalOrganizationApi } from "@/services/additionalOrganization";
import {
  centsToDecimalString,
  decimalStringToCents,
  parseBrlToCents,
} from "@/utils/format";
import type {
  AdditionalOrganizationItem,
  AdditionalOrganizationItemCreate,
  AdditionalOrganizationItemUpdate,
} from "@/types/additionalOrganization";

interface AllocationFormSheetProps {
  open: boolean;
  organizationId: string;
  showObservations: boolean;
  onClose: () => void;
  onSuccess: (item: AdditionalOrganizationItem) => void;
  onConflict?: () => void;
  initial?: AdditionalOrganizationItem | null;
}

function itemAmountInput(item?: AdditionalOrganizationItem | null) {
  if (!item) return "";
  return centsToDecimalString(
    decimalStringToCents(item.amount),
  ).replace(".", ",");
}

export function AllocationFormSheet({
  open,
  organizationId,
  showObservations,
  onClose,
  onSuccess,
  onConflict,
  initial,
}: AllocationFormSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, panelRef);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [observation, setObservation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setName(initial?.name ?? "");
    setAmount(itemAmountInput(initial));
    setObservation(initial?.observation ?? "");
    setError(null);
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

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Informe o nome da linha.");
      return;
    }

    const amountCents = parseBrlToCents(amount);
    if (amountCents === null || amountCents <= 0) {
      setError(
        "Informe um valor maior que zero, com até 2 casas decimais.",
      );
      return;
    }

    setLoading(true);
    try {
      const trimmedObservation = observation.trim() || null;
      let saved: AdditionalOrganizationItem;

      if (initial) {
        const payload: AdditionalOrganizationItemUpdate = {
          name: trimmedName,
          amount: centsToDecimalString(amountCents),
          expected_updated_at: initial.updated_at,
          ...(showObservations
            ? { observation: trimmedObservation }
            : {}),
        };
        saved = await additionalOrganizationApi.updateItem(
          organizationId,
          initial.id,
          payload,
        );
      } else {
        const payload: AdditionalOrganizationItemCreate = {
          name: trimmedName,
          amount: centsToDecimalString(amountCents),
          observation: showObservations ? trimmedObservation : null,
        };
        saved = await additionalOrganizationApi.createItem(
          organizationId,
          payload,
        );
      }

      onSuccess(saved);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        onConflict?.();
      }
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar a linha.",
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
        aria-labelledby="allocation-form-title"
        tabIndex={-1}
        className="flex max-h-[90dvh] w-full flex-col rounded-t-2xl border border-slate-200 bg-white shadow-xl outline-none dark:border-slate-700 dark:bg-slate-800 sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h2
            id="allocation-form-title"
            className="text-base font-semibold text-slate-900 dark:text-white"
          >
            {initial ? "Editar linha" : "Adicionar linha"}
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
          id="allocation-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto overscroll-contain px-5 py-4"
          noValidate
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="allocation-name"
                className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Nome
              </label>
              <input
                id="allocation-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex: Cartão de crédito"
                maxLength={255}
                autoComplete="off"
                className="min-h-[48px] w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
              />
            </div>

            <div>
              <label
                htmlFor="allocation-amount"
                className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Valor (R$)
              </label>
              <MoneyInput
                id="allocation-amount"
                value={amount}
                onChange={setAmount}
                ariaDescribedBy={error ? "allocation-form-error" : undefined}
              />
            </div>

            {showObservations && (
              <div>
                <label
                  htmlFor="allocation-observation"
                  className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Observação{" "}
                  <span className="font-normal text-slate-400">
                    (opcional)
                  </span>
                </label>
                <input
                  id="allocation-observation"
                  type="text"
                  value={observation}
                  onChange={(event) => setObservation(event.target.value)}
                  placeholder="Ex: Pagamento da fatura"
                  maxLength={500}
                  autoComplete="off"
                  className="min-h-[48px] w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
                />
              </div>
            )}

            {error && (
              <p
                id="allocation-form-error"
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
            form="allocation-form"
            disabled={loading || !name.trim() || !amount.trim()}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-medium text-white hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {initial ? "Salvar linha" : "Adicionar linha"}
          </button>
        </div>
      </div>
    </div>
  );
}
