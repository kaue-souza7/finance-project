import { Mail, UserPlus } from "lucide-react";
import type { ChatInviteResponse } from "@/types/finance";

interface InviteBannerProps {
  invites: ChatInviteResponse[];
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
}

export function InviteBanner({ invites, onAccept, onDecline }: InviteBannerProps) {
  if (invites.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-800 dark:bg-sky-900/20"
        >
          <div className="rounded-full bg-sky-100 p-2 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
            <UserPlus size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {invite.sender_name || invite.sender_email}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quer iniciar um chat com você
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onDecline(invite.id)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Recusar
            </button>
            <button
              onClick={() => onAccept(invite.id)}
              className="flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500"
            >
              <Mail size={14} />
              Aceitar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
