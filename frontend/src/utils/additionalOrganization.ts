import {
  centsToDecimalString,
  decimalStringToCents,
} from "@/utils/format";
import type {
  AdditionalOrganizationItem,
  AdditionalOrganizationType,
} from "@/types/additionalOrganization";

export interface OrganizationTotals {
  totalCents: number;
  allocatedCents: number;
  remainingCents: number;
  isOverBudget: boolean;
  progressPercent: number;
}

export function calculateOrganizationTotals(
  totalAmount: string | null,
  items: Pick<AdditionalOrganizationItem, "amount">[],
): OrganizationTotals {
  const totalCents =
    totalAmount === null ? 0 : decimalStringToCents(totalAmount);
  const allocatedCents = items.reduce(
    (sum, item) => sum + decimalStringToCents(item.amount),
    0,
  );
  const remainingCents = totalCents - allocatedCents;
  const progressPercent =
    totalCents > 0
      ? Math.min(100, Math.round((allocatedCents / totalCents) * 100))
      : 0;

  return {
    totalCents,
    allocatedCents,
    remainingCents,
    isOverBudget: remainingCents < 0,
    progressPercent,
  };
}

export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function organizationTypeLabel(
  type: AdditionalOrganizationType,
): string {
  return type === "free_text" ? "Texto Livre" : "Receita Adicional";
}

export function centsToEditableInput(cents: number | null): string {
  if (cents === null || cents <= 0) return "";
  return centsToDecimalString(cents).replace(".", ",");
}
