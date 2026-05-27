import { useState } from "react";
import { Eye, EyeOff, Loader2, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { AvatarUpload } from "@/components/AvatarUpload";
import { uploadAvatar, removeAvatar, updateProfile, changePassword } from "@/services/profile";

export function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  if (!user) return null;

  const hasProfileChanges = name !== user.name || email !== user.email;

  const handleUpload = async (file: File) => {
    setAvatarLoading(true);
    try {
      await uploadAvatar(file);
      await refreshUser();
      toast("Foto atualizada com sucesso", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao atualizar foto", "error");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleRemove = async () => {
    setAvatarLoading(true);
    try {
      await removeAvatar();
      await refreshUser();
      toast("Foto removida com sucesso", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao remover foto", "error");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const updated = await updateProfile({ name: name.trim(), email: email.trim() });
      setName(updated.name);
      setEmail(updated.email);
      await refreshUser();
      toast("Dados atualizados com sucesso", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao salvar dados", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast("As senhas não conferem", "error");
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast("Senha alterada com sucesso", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao alterar senha", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Meu Perfil</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Gerencie suas informações pessoais.
      </p>

      <div className="mt-6 space-y-6">
        <Card>
          <div className="flex flex-col items-center py-4">
            <AvatarUpload
              currentUrl={user.avatar_url}
              userName={user.name}
              onUpload={handleUpload}
              onRemove={handleRemove}
              loading={avatarLoading}
            />
            <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
                  JPEG, PNG ou WebP. Máximo de 5MB.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Dados Pessoais" />
          <div className="space-y-4">
            <FieldGroup label="Nome">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-white dark:focus:ring-white"
                placeholder="Seu nome"
              />
            </FieldGroup>

            <FieldGroup label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-white dark:focus:ring-white"
                placeholder="seu@email.com"
              />
            </FieldGroup>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleSaveProfile}
                disabled={!hasProfileChanges || savingProfile}
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {savingProfile ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {savingProfile ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Alterar Senha" />
          <form onSubmit={handleChangePassword} className="space-y-4">
            <PasswordField
              label="Senha atual"
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurrent}
              onToggle={() => setShowCurrent(!showCurrent)}
              placeholder="Sua senha atual"
            />

            <PasswordField
              label="Nova senha"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew(!showNew)}
              placeholder="Nova senha"
            />

            <PasswordField
              label="Confirmar nova senha"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm(!showConfirm)}
              placeholder="Repita a nova senha"
            />

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={
                  !currentPassword || !newPassword || !confirmPassword || savingPassword
                }
                className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {savingPassword ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {savingPassword ? "Alterando..." : "Alterar senha"}
              </button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Conta" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Membro desde{" "}
            {new Date(user.created_at).toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </Card>
      </div>
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/50">
      {children}
    </div>
  );
}

function CardHeader({ title }: { title: string }) {
  return (
    <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">
      {title}
    </h2>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
}) {
  return (
    <FieldGroup label={label}>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-white dark:focus:ring-white"
          placeholder={placeholder}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          aria-label={show ? "Esconder senha" : "Mostrar senha"}
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </FieldGroup>
  );
}
