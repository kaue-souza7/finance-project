import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  PencilLine,
  Trash2,
} from "lucide-react";
import { MoneyInput } from "@/components/additionalOrganization/MoneyInput";
import {
  centsToDecimalString,
  decimalStringToCents,
  parseBrlToCents,
} from "@/utils/format";
import type {
  AdditionalOrganizationItem,
  AdditionalOrganizationItemUpdate,
} from "@/types/additionalOrganization";

type RowStatus = "idle" | "saving" | "saved" | "error";

interface AllocationTableRowProps {
  item: AdditionalOrganizationItem;
  showObservations: boolean;
  onUpdate: (
    item: AdditionalOrganizationItem,
    data: AdditionalOrganizationItemUpdate,
  ) => Promise<AdditionalOrganizationItem>;
  onDelete: (item: AdditionalOrganizationItem) => void;
}

function itemAmountInput(item: AdditionalOrganizationItem): string {
  return centsToDecimalString(
    decimalStringToCents(item.amount),
  ).replace(".", ",");
}

function AllocationTableRow({
  item,
  showObservations,
  onUpdate,
  onDelete,
}: AllocationTableRowProps) {
  const [name, setName] = useState(item.name);
  const [amount, setAmount] = useState(itemAmountInput(item));
  const [observation, setObservation] = useState(
    item.observation ?? "",
  );
  const [status, setStatus] = useState<RowStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const rowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (savingRef.current) return;
    if (rowRef.current?.contains(document.activeElement)) return;
    setName(item.name);
    setAmount(itemAmountInput(item));
    setObservation(item.observation ?? "");
    setError(null);
  }, [item]);

  const save = async () => {
    if (savingRef.current) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Informe o nome.");
      setStatus("error");
      return;
    }

    const amountCents = parseBrlToCents(amount);
    if (amountCents === null || amountCents <= 0) {
      setError("Valor inválido.");
      setStatus("error");
      return;
    }

    const nextAmount = centsToDecimalString(amountCents);
    const nextObservation = showObservations
      ? observation.trim() || null
      : undefined;

    const unchanged =
      trimmedName === item.name &&
      nextAmount === item.amount &&
      (nextObservation === undefined ||
        nextObservation === item.observation);
    if (unchanged) {
      setStatus("idle");
      setError(null);
      return;
    }

    savingRef.current = true;
    setStatus("saving");
    setError(null);
    try {
      await onUpdate(item, {
        name: trimmedName,
        amount: nextAmount,
        ...(showObservations
          ? { observation: nextObservation ?? null }
          : {}),
        expected_updated_at: item.updated_at,
      });
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Erro ao salvar linha.",
      );
    } finally {
      savingRef.current = false;
    }
  };

  const revert = () => {
    setName(item.name);
    setAmount(itemAmountInput(item));
    setObservation(item.observation ?? "");
    setError(null);
    setStatus("idle");
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      revert();
      event.currentTarget.blur();
    }
  };

  return (
    <tr
      ref={rowRef}
      className="border-t border-slate-100 align-top dark:border-slate-700/70"
    >
      <td className="px-3 py-2">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => void save()}
          onKeyDown={handleKeyDown}
          maxLength={255}
          aria-label={`Nome da linha ${item.position}`}
          className="min-h-[44px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
        />
        {error && (
          <p
            role="alert"
            className="mt-1 text-xs text-rose-600 dark:text-rose-400"
          >
            {error}
          </p>
        )}
      </td>

      <td className="px-3 py-2">
        <MoneyInput
          id={`allocation-amount-${item.id}`}
          value={amount}
          onChange={setAmount}
          onBlur={() => void save()}
          compact
          ariaLabel={`Valor da linha ${item.position}`}
          className="text-right"
        />
      </td>

      {showObservations && (
        <td className="px-3 py-2">
          <input
            type="text"
            value={observation}
            onChange={(event) => setObservation(event.target.value)}
            onBlur={() => void save()}
            onKeyDown={handleKeyDown}
            maxLength={500}
            placeholder="Opcional"
            aria-label={`Observação da linha ${item.position}`}
            className="min-h-[44px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
          />
        </td>
      )}

      <td className="px-3 py-2">
        <div className="flex items-center justify-end gap-1">
          <span
            className="flex h-11 w-6 items-center justify-center"
            aria-live="polite"
          >
            {status === "saving" && (
              <Loader2
                size={15}
                className="animate-spin text-slate-400"
                aria-label="Salvando"
              />
            )}
            {status === "saved" && (
              <CheckCircle2
                size={15}
                className="text-emerald-500"
                aria-label="Salvo"
              />
            )}
            {status === "error" && (
              <PencilLine
                size={15}
                className="text-rose-500"
                aria-label="Erro ao salvar"
              />
            )}
          </span>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
            aria-label={`Excluir ${item.name}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

interface AllocationTableProps {
  items: AdditionalOrganizationItem[];
  showObservations: boolean;
  onUpdate: (
    item: AdditionalOrganizationItem,
    data: AdditionalOrganizationItemUpdate,
  ) => Promise<AdditionalOrganizationItem>;
  onDelete: (item: AdditionalOrganizationItem) => void;
}

export function AllocationTable({
  items,
  showObservations,
  onUpdate,
  onDelete,
}: AllocationTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block dark:border-slate-700 dark:bg-slate-800/50">
      <table className="w-full table-fixed">
        <caption className="sr-only">
          Distribuição da receita adicional
        </caption>
        <thead>
          <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <th scope="col" className="w-[38%] px-3 py-3">
              Nome
            </th>
            <th scope="col" className="w-[24%] px-3 py-3">
              Valor
            </th>
            {showObservations && (
              <th scope="col" className="w-[28%] px-3 py-3">
                Observação
              </th>
            )}
            <th scope="col" className="w-[10%] px-3 py-3">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <AllocationTableRow
              key={item.id}
              item={item}
              showObservations={showObservations}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
