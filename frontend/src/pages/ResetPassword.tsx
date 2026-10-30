import { type FormEvent, useState } from "react";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/services/api";

function passwordError(password: string): string | null {
  if (password.length < 8) return "Use pelo menos 8 caracteres.";
  if (!/[A-Z]/.test(password)) return "Inclua uma letra maiúscula.";
  if (!/[a-z]/.test(password)) return "Inclua uma letra minúscula.";
  if (!/[0-9]/.test(password)) return "Inclua um número.";
  return null;
}

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validation = passwordError(password);
    if (validation) {
      setError(validation);
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/reset-password", {
        token,
        new_password: password,
        confirm_new_password: confirm,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Link inválido ou incompleto. Solicite um novo link de recuperação.
          </p>
          <Link
            to="/forgot-password"
            className="mt-4 inline-block text-sm font-semibold text-indigo-600 dark:text-indigo-400"
          >
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 dark:from-[#0c0c1e] dark:via-[#0f172a] dark:to-[#160a24]">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200/60 bg-white/80 p-8 shadow-xl shadow-indigo-500/5 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/70">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 size={36} className="text-emerald-500" />
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              Senha redefinida
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sua senha foi alterada e todas as sessões antigas foram encerradas.
            </p>
            <Link
              to="/login"
              className="mt-2 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white"
            >
              Entrar
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-7 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <KeyRound size={22} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Criar nova senha
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                Mínimo de 8 caracteres, com maiúscula, minúscula e número.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-rose-200/80 bg-rose-50/80 px-4 py-3 text-sm text-rose-600 dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-rose-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label
                  htmlFor="reset-password"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Nova senha
                </label>
                <input
                  id="reset-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label
                  htmlFor="reset-confirm"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Confirmar senha
                </label>
                <input
                  id="reset-confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? "Salvando..." : "Redefinir senha"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
