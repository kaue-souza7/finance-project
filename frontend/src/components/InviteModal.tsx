import { useState } from "react";
import { Loader2, MessageSquarePlus, X } from "lucide-react";
import { chatInviteApi } from "@/services/chatInvite";

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteModal({ open, onClose, onSuccess }: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSend = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await chatInviteApi.send(email.trim());
      setEmail("");
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar convite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="w-full rounded-t-2xl border border-slate-200 bg-white p-6 shadow-xl sm:max-w-sm sm:rounded-xl dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-sky-100 p-2 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
              <MessageSquarePlus size={20} />
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Novo chat
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email do usuário
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@email.com"
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:text-white dark:placeholder-slate-500"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex min-h-[48px] items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 sm:min-h-0 sm:px-4 sm:py-2"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !email.trim()}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 sm:min-h-0 sm:px-4 sm:py-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Convidar
          </button>
        </div>
      </div>
    </div>
  );
}
