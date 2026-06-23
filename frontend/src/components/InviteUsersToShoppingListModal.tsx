import { useEffect, useRef, useState } from "react";
import { Loader2, Search, UserPlus, X } from "lucide-react";
import { Toast } from "@/components/Toast";
import { shoppingListApi } from "@/services/shoppingList";
import { userApi } from "@/services/user";
import type { UserSearchResponse } from "@/types/finance";

interface InviteUsersToShoppingListModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  listId: string;
}

export function InviteUsersToShoppingListModal({
  open,
  onClose,
  onSuccess,
  listId,
}: InviteUsersToShoppingListModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResponse[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResponse | null>(
    null,
  );
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedUser(null);
      setRole("editor");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim() || selectedUser) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await userApi.search(query.trim());
        setResults(data);
      } catch (err) {
        console.error("Erro ao buscar usuários:", err);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selectedUser]);

  const handleSend = async () => {
    if (!selectedUser) return;
    setSending(true);
    try {
      await shoppingListApi.sendInvite(listId, {
        user_email: selectedUser.email,
        role,
      });
      setToast({ message: "Convite enviado!", variant: "success" });
      setSelectedUser(null);
      setQuery("");
      setResults([]);
      onSuccess();
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : "Erro ao enviar convite",
        variant: "error",
      });
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
        <div
          className="flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-xl dark:bg-slate-900 lg:mx-4 lg:w-full lg:max-w-md lg:rounded-2xl animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <UserPlus size={18} className="text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Convidar para lista
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={inputRef}
                type="text"
                value={selectedUser ? selectedUser.name : query}
                onChange={(e) => {
                  setSelectedUser(null);
                  setQuery(e.target.value);
                }}
                placeholder="Buscar por nome ou email..."
                className="w-full rounded-lg border border-slate-200 bg-transparent py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-600 dark:text-white dark:placeholder-slate-500"
              />
              {selectedUser && (
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {searching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={20} className="animate-spin text-slate-400" />
              </div>
            )}

            {!searching && results.length > 0 && !selectedUser && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
                {results.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user);
                      setResults([]);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {user.email}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedUser && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Permissão
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRole("editor")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      role === "editor"
                        ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    Editor
                  </button>
                  <button
                    onClick={() => setRole("viewer")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      role === "viewer"
                        ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    Visualizador
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  {role === "editor"
                    ? "Pode editar itens da lista"
                    : "Apenas visualizar a lista"}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                disabled={sending}
                className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSend}
                disabled={!selectedUser || sending}
                className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {sending && <Loader2 size={16} className="animate-spin" />}
                Convidar
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toast
        open={toast !== null}
        message={toast?.message ?? ""}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />
    </>
  );
}
