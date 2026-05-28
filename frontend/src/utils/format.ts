export function parseBrl(value: string): number {
  const cleaned = value.trim();
  if (!cleaned) return NaN;

  const normalized = cleaned.replace(/\./g, "").replace(",", ".");

  if (!/^\d+(\.\d+)?$/.test(normalized)) return NaN;

  return parseFloat(normalized);
}
