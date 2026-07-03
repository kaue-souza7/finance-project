import { useCallback, useEffect, useState } from "react";
import { Fingerprint, Loader2, Moon, Smartphone, Sun, SunMoon, Trash2 } from "lucide-react";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useWebAuthn } from "@/webauthn/hooks/useWebAuthn";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { WebAuthnCredentialInfo } from "@/webauthn/types/webauthn";

export function Settings() {
  const { theme, setTheme, density, setDensity } = usePreferences();

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Configurações
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Personalize sua experiência.
      </p>

      <div className="mt-6 space-y-6">
        <CardSection title="Aparência">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Escolha entre tema claro, escuro ou automático.
          </p>
          <div className="mt-3 flex gap-3">
            <OptionCard
              icon={<Sun size={20} />}
              label="Claro"
              selected={theme === "light"}
              onClick={() => setTheme("light")}
            />
            <OptionCard
              icon={<Moon size={20} />}
              label="Escuro"
              selected={theme === "dark"}
              onClick={() => setTheme("dark")}
            />
          </div>
        </CardSection>

        <CardSection title="Densidade">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Controle o espaçamento dos elementos na interface.
          </p>
          <div className="mt-3 flex gap-3">
            <OptionCard
              icon={<SunMoon size={20} />}
              label="Confortável"
              selected={density === "comfortable"}
              onClick={() => setDensity("comfortable")}
            />
            <OptionCard
              icon={<SunMoon size={20} />}
              label="Compacto"
              selected={density === "compact"}
              onClick={() => setDensity("compact")}
            />
          </div>
        </CardSection>

        <SecuritySection />
      </div>
    </section>
  );
}

function SecuritySection() {
  const [creds, setCreds] = useState<WebAuthnCredentialInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { register, listCredentials, removeCredential } = useWebAuthn();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCredentials();
      setCreds(data);
    } catch {
      setCreds([]);
    } finally {
      setLoading(false);
    }
  }, [listCredentials]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRegister = async () => {
    try {
      const id = await register();
      if (id) await load();
    } catch {
      // erro silencioso — usuario ja foi notificado pelo hook
    }
  };

  const handleRemove = async (credentialId: string) => {
    setRemovingId(credentialId);
    try {
      await removeCredential(credentialId);
      setCreds((prev) => prev.filter((c) => c.id !== credentialId));
      if (creds.length <= 1) {
        localStorage.removeItem("webauthn_device");
      }
    } catch {
      // erro silencioso
    } finally {
      setRemovingId(null);
      setConfirmDelete(null);
    }
  };

  return (
    <>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Remover dispositivo"
        message="Tem certeza que deseja remover este dispositivo? O login biométrico será desativado nele."
        loading={removingId === confirmDelete}
        onConfirm={() => confirmDelete && handleRemove(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />


    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/50">
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
        <Fingerprint size={18} className="text-indigo-600 dark:text-indigo-400" />
        Segurança
      </h2>

      {loading ? (
        <div className="mt-4 flex items-center justify-center py-4">
          <Loader2 size={20} className="animate-spin text-slate-400" />
        </div>
      ) : creds.length === 0 ? (
        <div className="mt-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nenhum dispositivo cadastrado para login biométrico.
          </p>
          <button
            onClick={handleRegister}
            className="mt-3 flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-medium text-white hover:from-indigo-500 hover:to-violet-500"
          >
            <Fingerprint size={16} />
            Cadastrar dispositivo
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Dispositivos com acesso biométrico:
          </p>
          {creds.map((cred) => (
            <div
              key={cred.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/30"
            >
              <div className="flex items-center gap-3">
                <Smartphone size={18} className="text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {cred.deviceName || "Dispositivo"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {cred.lastUsedAt
                      ? `Último acesso: ${new Date(cred.lastUsedAt).toLocaleDateString("pt-BR")}`
                      : `Cadastrado em ${new Date(cred.createdAt).toLocaleDateString("pt-BR")}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmDelete(cred.id)}
                disabled={removingId === cred.id}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20"
                aria-label="Remover dispositivo"
              >
                {removingId === cred.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </div>
          ))}
          <button
            onClick={handleRegister}
            className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-800 dark:border-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <Fingerprint size={16} />
            Cadastrar novo dispositivo
          </button>
        </div>
      )}
    </div>
    </>
  );
}

function CardSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/50">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
        {title}
      </h2>
      {children}
    </div>
  );
}

function OptionCard({
  icon,
  label,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
        selected
          ? "border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500 dark:text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
