import { useEffect, useRef } from "react";
import {
  Loader2,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import { InviteItem } from "@/components/InviteItem";
import type { ChatInviteResponse } from "@/types/finance";

interface InviteBottomSheetProps {
  open: boolean;
  onClose: () => void;
  invites: ChatInviteResponse[];
  loading: boolean;
  acting: string | null;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

export function InviteBottomSheet({
  open,
  onClose,
  invites,
  loading,
  acting,
  onAccept,
  onDecline,
}: InviteBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.documentElement.classList.add("no-scroll");
      sheetRef.current?.focus();
    } else {
      document.documentElement.classList.remove("no-scroll");
      previousFocusRef.current?.focus();
    }
    return () => {
      document.documentElement.classList.remove("no-scroll");
    };
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label="Convites recebidos"
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-xl outline-none dark:bg-slate-900 lg:mx-4 lg:w-full lg:max-w-lg lg:rounded-2xl animate-slide-up-sheet lg:animate-slide-up"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Convites recebidos
              </h2>
              {invites.length > 0 && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
                  {invites.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto overscroll-contain px-5 py-4">
            {loading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={24} className="animate-spin text-slate-400" />
              </div>
            )}

            {!loading && invites.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-10 text-center">
                <UserPlus
                  size={40}
                  className="text-slate-300 dark:text-slate-600"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Nenhum convite pendente
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Os convites que você receber aparecerão aqui.
                  </p>
                </div>
              </div>
            )}

            {!loading && invites.length > 0 && (
              <div className="space-y-3">
                {invites.map((invite) => (
                  <InviteItem
                    key={invite.id}
                    senderName={invite.sender_name}
                    senderEmail={invite.sender_email}
                    acting={acting === invite.id}
                    onAccept={() => onAccept(invite.id)}
                    onDecline={() => onDecline(invite.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
