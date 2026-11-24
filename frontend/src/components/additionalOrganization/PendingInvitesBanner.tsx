import { Mail, Users } from "lucide-react";

interface PendingInvitesBannerProps {
  count: number;
  onOpen: () => void;
}

export function PendingInvitesBanner({
  count,
  onOpen,
}: PendingInvitesBannerProps) {
  if (count <= 0) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="mb-4 flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-left transition-colors hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-900/20 dark:hover:bg-sky-900/30"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">
        <Mail size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900 dark:text-white">
          {count === 1
            ? "Você tem 1 convite de organização"
            : `Você tem ${count} convites de organização`}
        </span>
        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
          Toque para visualizar e responder.
        </span>
      </span>
      <Users size={18} className="shrink-0 text-sky-600 dark:text-sky-400" />
    </button>
  );
}
