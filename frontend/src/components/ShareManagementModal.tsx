import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Card } from "@/components/Card";
import { Toast } from "@/components/Toast";
import { shoppingListApi } from "@/services/shoppingList";
import { userApi } from "@/services/user";
import type {
  ShoppingListInviteResponse,
  ShoppingListShareResponse,
  UserSearchResponse,
} from "@/types/finance";

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface ShareManagementModalProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  listId: string;
}

export function ShareManagementModal({
  open,
  onClose,
  onUpdate,
  listId,
}: ShareManagementModalProps) {
  const [shares, setShares] = useState<ShoppingListShareResponse[]>([]);
  const [pendingInvites, setPendingInvites] = useState<
    ShoppingListInviteResponse[]
  >([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResponse[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResponse | null>(
    null,
  );
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [sending, setSending] = useState(false);

  const [actingId, setActingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sharesData, invitesData] = await Promise.all([
        shoppingListApi.listShares(listId),
        shoppingListApi.listPendingInvites(listId),
      ]);
      setShares(sharesData);
      setPendingInvites(invitesData);
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : "Erro ao carregar dados",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    if (open) {
      loadData();
      setQuery("");
      setResults([]);
      setSelectedUser(null);
      setInviteRole("editor");
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, loadData]);

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

  const handleSendInvite = async () => {
    if (!selectedUser) return;
    setSending(true);
    try {
      const invite = await shoppingListApi.sendInvite(listId, {
        user_email: selectedUser.email,
        role: inviteRole,
      });
      setPendingInvites((prev) => [invite, ...prev]);
      setToast({ message: "Convite enviado!", variant: "success" });
      setSelectedUser(null);
      setQuery("");
      setResults([]);
      onUpdate();
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : "Erro ao enviar convite",
        variant: "error",
      });
    } finally {
      setSending(false);
    }
  };

  const handleRoleChange = async (
    shareId: string,
    newRole: "editor" | "viewer",
  ) => {
    setActingId(shareId);
    try {
      const updated = await shoppingListApi.updateShareRole(listId, shareId, {
        role: newRole,
      });
      setShares((prev) =>
        prev.map((s) => (s.id === shareId ? { ...s, role: updated.role } : s)),
      );
      setToast({ message: "Permissão atualizada", variant: "success" });
      onUpdate();
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : "Erro ao atualizar permissão",
        variant: "error",
      });
    } finally {
      setActingId(null);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    setActingId(shareId);
    try {
      await shoppingListApi.removeShare(listId, shareId);
      setShares((prev) => prev.filter((s) => s.id !== shareId));
      setToast({
        message: "Compartilhamento removido",
        variant: "success",
      });
      onUpdate();
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : "Erro ao remover compartilhamento",
        variant: "error",
      });
    } finally {
      setActingId(null);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setActingId(inviteId);
    try {
      await shoppingListApi.cancelInvite(listId, inviteId);
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
      setToast({ message: "Convite cancelado", variant: "success" });
      onUpdate();
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : "Erro ao cancelar convite",
        variant: "error",
      });
    } finally {
      setActingId(null);
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
          className="flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-xl dark:bg-slate-900 lg:mx-4 lg:w-full lg:max-w-lg lg:rounded-2xl animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Gerenciar Compartilhamento
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

          <div className="overflow-y-auto overscroll-contain px-5 py-4">
            {loading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={24} className="animate-spin text-slate-400" />
              </div>
            )}

            {!loading && (
              <div className="space-y-6">
                {/* ── Convidar ─────────────────────────────── */}
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Convidar
                  </h3>

                  <div className="space-y-3">
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
                      <div className="flex items-center justify-center py-2">
                        <Loader2
                          size={18}
                          className="animate-spin text-slate-400"
                        />
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
                        <div className="flex gap-2">
                          <button
                            onClick={() => setInviteRole("editor")}
                            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                              inviteRole === "editor"
                                ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400"
                                : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
                            }`}
                          >
                            Editor
                          </button>
                          <button
                            onClick={() => setInviteRole("viewer")}
                            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                              inviteRole === "viewer"
                                ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400"
                                : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
                            }`}
                          >
                            Visualizador
                          </button>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={handleSendInvite}
                            disabled={sending}
                            className="flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                          >
                            {sending && (
                              <Loader2 size={14} className="animate-spin" />
                            )}
                            <UserPlus size={15} />
                            Convidar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* ── Compartilhamentos Ativos ──────────────── */}
                <section>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Compartilhamentos Ativos
                  </h3>

                  {shares.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Nenhum compartilhamento ativo.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {shares.map((share) => (
                        <Card key={share.id}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              {(share.user_name ?? "U")
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {share.user_name ?? "Usuário"}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {share.user_email ?? ""}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                              <div className="flex rounded-lg border border-slate-200 dark:border-slate-600">
                                <button
                                  onClick={() =>
                                    handleRoleChange(share.id, "editor")
                                  }
                                  disabled={actingId === share.id}
                                  className={`rounded-l-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                                    share.role === "editor"
                                      ? "bg-sky-500 text-white"
                                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                                  }`}
                                >
                                  Editor
                                </button>
                                <button
                                  onClick={() =>
                                    handleRoleChange(share.id, "viewer")
                                  }
                                  disabled={actingId === share.id}
                                  className={`rounded-r-lg border-l border-slate-200 px-2.5 py-1.5 text-xs font-medium transition-colors dark:border-slate-600 ${
                                    share.role === "viewer"
                                      ? "bg-sky-500 text-white"
                                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                                  }`}
                                >
                                  Viewer
                                </button>
                              </div>

                              <button
                                onClick={() => handleRemoveShare(share.id)}
                                disabled={actingId === share.id}
                                className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-900/20"
                                aria-label="Remover"
                              >
                                {actingId === share.id ? (
                                  <Loader2
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>

                {/* ── Convites Pendentes ───────────────────── */}
                {pendingInvites.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Convites Pendentes
                    </h3>

                    <div className="space-y-2">
                      {pendingInvites.map((invite) => (
                        <Card key={invite.id}>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              <Loader2 size={14} className="animate-spin" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {invite.receiver_name ??
                                  invite.receiver_email ??
                                  "Usuário"}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                  {invite.role === "editor"
                                    ? "Editor"
                                    : "Visualizador"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <CalendarDays size={10} />
                                  {formatDateTime(invite.created_at)}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleCancelInvite(invite.id)}
                              disabled={actingId === invite.id}
                              className="flex min-h-[32px] min-w-[32px] shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-900/20"
                              aria-label="Cancelar convite"
                            >
                              {actingId === invite.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <X size={14} />
                              )}
                            </button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
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
