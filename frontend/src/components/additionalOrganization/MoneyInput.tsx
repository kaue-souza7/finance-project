interface MoneyInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string | null;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
  compact?: boolean;
}

export function MoneyInput({
  id,
  value,
  onChange,
  onBlur,
  disabled = false,
  error,
  ariaLabel,
  ariaDescribedBy,
  className = "",
  compact = false,
}: MoneyInputProps) {
  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      enterKeyHint="done"
      autoComplete="off"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      onFocus={(event) => event.currentTarget.select()}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-invalid={Boolean(error)}
      aria-describedby={ariaDescribedBy}
      placeholder="0,00"
      className={`w-full rounded-lg border bg-white text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 ${
        compact
          ? "min-h-[44px] px-3 py-2 text-sm"
          : "px-4 py-3 text-base"
      } ${
        error
          ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-700 dark:focus:border-rose-400 dark:focus:ring-rose-400/20"
          : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-slate-600 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
      } ${className}`}
    />
  );
}
