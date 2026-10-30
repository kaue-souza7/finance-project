import { type FormEvent, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Informe seu e-mail.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar o link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 dark:from-[#0c0c1e] dark:via-[#0f172a] dark:to-[#160a24]">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200/60 bg-white/80 p-8 shadow-xl shadow-indigo-500/5 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/70">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft size={16} />
          Voltar para o login
        </Link>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 size={36} className="text-emerald-500" />
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              Verifique seu e-mail
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Se existir uma conta com <strong>{email}</strong>, enviaremos um
              link para redefinir sua senha. O link expira em 30 minutos.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-7 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <Mail size={22} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Recuperar senha
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                Informe seu e-mail para receber o link de redefinição.
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
                  htmlFor="forgot-email"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  E-mail
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  inputMode="email"
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
                {loading ? "Enviando..." : "Enviar link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
