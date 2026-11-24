export function formatBrl(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function parseBrl(value: string): number {
  const cleaned = value.trim();
  if (!cleaned) return NaN;

  const normalized = cleaned.replace(/\./g, "").replace(",", ".");

  if (!/^\d+(\.\d+)?$/.test(normalized)) return NaN;

  return parseFloat(normalized);
}

export function parseBrlToCents(value: string): number | null {
  const cleaned = value
    .trim()
    .replace(/^R\$\s?/i, "")
    .replace(/\s/g, "");

  if (!cleaned || !/^\d[\d.,]*$/.test(cleaned)) return null;

  let normalized: string;

  if (cleaned.includes(",")) {
    if ((cleaned.match(/,/g) ?? []).length !== 1) return null;
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(".")) {
    const parts = cleaned.split(".");
    if (parts.some((part) => part === "")) return null;

    if (parts.length === 2 && parts[1].length === 3) {
      normalized = parts.join("");
    } else if (parts.length > 2) {
      if (parts.slice(1).some((part) => part.length !== 3)) return null;
      normalized = parts.join("");
    } else {
      normalized = cleaned;
    }
  } else {
    normalized = cleaned;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const [integerPart, fractionPart = ""] = normalized.split(".");
  if (integerPart.replace(/^0+(?=\d)/, "").length > 10) return null;

  const cents =
    Number(integerPart) * 100 +
    Number(fractionPart.padEnd(2, "0"));

  return Number.isSafeInteger(cents) ? cents : null;
}

export function decimalStringToCents(value: string): number {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return 0;

  const sign = match[1] === "-" ? -1 : 1;
  const cents =
    Number(match[2]) * 100 +
    Number((match[3] ?? "").padEnd(2, "0"));

  return Number.isSafeInteger(cents) ? sign * cents : 0;
}

export function centsToDecimalString(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(Math.trunc(cents));
  const integerPart = Math.floor(absolute / 100);
  const fractionPart = String(absolute % 100).padStart(2, "0");
  return `${sign}${integerPart}.${fractionPart}`;
}

export function formatCentsBRL(cents: number): string {
  return formatBrl(cents / 100);
}
