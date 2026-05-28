import { Check, Loader2, UserX } from "lucide-react";

interface InviteItemProps {
  senderName: string | null;
  senderEmail: string | null;
  acting: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function InviteItem({
  senderName,
  senderEmail,
  acting,
  onAccept,
  onDecline,
}: InviteItemProps) {
  const displayName = senderName ?? senderEmail ?? "Usuário";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
        {initial}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
          {senderName ?? senderEmail}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Quer iniciar um chat com você
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onDecline}
          disabled={acting}
          className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label="Recusar convite"
        >
          <UserX size={14} />
          <span className="hidden sm:inline">Recusar</span>
        </button>
        <button
          type="button"
          onClick={onAccept}
          disabled={acting}
          className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          aria-label="Aceitar convite"
        >
          {acting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Check size={14} />
          )}
          <span className="hidden sm:inline">Aceitar</span>
        </button>
      </div>
    </div>
  );
}
