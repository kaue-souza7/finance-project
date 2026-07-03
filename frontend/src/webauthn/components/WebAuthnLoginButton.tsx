import { useState } from "react";
import { Fingerprint, Loader2 } from "lucide-react";
import { useWebAuthn } from "../hooks/useWebAuthn";

interface WebAuthnLoginButtonProps {
  onToken: (token: string) => void;
}

export function WebAuthnLoginButton({ onToken }: WebAuthnLoginButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authenticate } = useWebAuthn();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await authenticate();
      if (token) {
        onToken(token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  };

  if (!localStorage.getItem("webauthn_device")) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleLogin}
        disabled={loading}
        className="flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow active:scale-[0.98] disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        aria-label="Entrar com biometria"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Aguardando biometria...
          </>
        ) : (
          <>
            <Fingerprint size={18} className="text-indigo-600 dark:text-indigo-400" />
            Entrar com biometria
          </>
        )}
      </button>

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
