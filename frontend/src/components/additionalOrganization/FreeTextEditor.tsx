import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Save,
} from "lucide-react";
import { ContentConflictDialog } from "@/components/additionalOrganization/ContentConflictDialog";
import { useToast } from "@/contexts/ToastContext";
import { ApiError } from "@/services/api";
import { additionalOrganizationApi } from "@/services/additionalOrganization";
import type {
  AdditionalOrganizationDetail,
  AdditionalOrganizationSummary,
} from "@/types/additionalOrganization";

type SaveStatus =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "error"
  | "conflict";

interface FreeTextEditorProps {
  organization: AdditionalOrganizationDetail;
  onSaved: (
    organization: AdditionalOrganizationSummary,
    content: string,
  ) => void;
  onReload: () => void;
}

export function FreeTextEditor({
  organization,
  onSaved,
  onReload,
}: FreeTextEditorProps) {
  const [content, setContent] = useState(organization.content ?? "");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [conflictOpen, setConflictOpen] = useState(false);
  const [conflictLoading, setConflictLoading] = useState(false);
  const [remoteContent, setRemoteContent] = useState(
    organization.content ?? "",
  );
  const [remoteVersion, setRemoteVersion] = useState(
    organization.content_version,
  );
  const { toast: showToast } = useToast();

  const contentRef = useRef(content);
  const savedContentRef = useRef(organization.content ?? "");
  const savedVersionRef = useRef(organization.content_version);
  const savingRef = useRef(false);
  const queuedRef = useRef(false);
  const conflictRef = useRef(false);
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    if (contentRef.current !== savedContentRef.current) return;

    const initial = organization.content ?? "";
    setContent(initial);
    contentRef.current = initial;
    savedContentRef.current = initial;
    savedVersionRef.current = organization.content_version;
    setRemoteContent(initial);
    setRemoteVersion(organization.content_version);
    setStatus("idle");
  }, [
    organization.id,
    organization.content,
    organization.content_version,
  ]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (
        !conflictRef.current &&
        contentRef.current !== savedContentRef.current
      ) {
        void additionalOrganizationApi
          .updateContent(organization.id, {
            content: contentRef.current || null,
            expected_version: savedVersionRef.current,
          })
          .catch(() => {
            // A organização pode ter sido removida ou estar indisponível.
          });
      }
    };
  }, [organization.id]);

  const openConflict = useCallback(async () => {
    conflictRef.current = true;
    setStatus("conflict");
    try {
      const current = await additionalOrganizationApi.getById(
        organization.id,
      );
      setRemoteContent(current.content ?? "");
      setRemoteVersion(current.content_version);
      setConflictOpen(true);
    } catch {
      conflictRef.current = false;
      showToast(
        "O texto foi alterado por outra pessoa, mas não foi possível carregar a versão atual.",
        "error",
      );
      setStatus("error");
    }
  }, [organization.id, showToast]);

  const saveContent = useCallback(
    async (value: string) => {
      if (conflictRef.current) return;
      if (savingRef.current) {
        queuedRef.current = true;
        return;
      }
      if (value === savedContentRef.current) return;

      savingRef.current = true;
      setStatus("saving");

      try {
        const saved = await additionalOrganizationApi.updateContent(
          organization.id,
          {
            content: value || null,
            expected_version: savedVersionRef.current,
          },
        );
        savedContentRef.current = value;
        savedVersionRef.current = saved.content_version;
        if (mountedRef.current) {
          setStatus("saved");
          onSaved(saved, value);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          if (mountedRef.current) {
            await openConflict();
          }
        } else if (mountedRef.current) {
          setStatus("error");
          showToast(
            error instanceof Error
              ? error.message
              : "Erro ao salvar anotações",
            "error",
          );
        }
      } finally {
        savingRef.current = false;
        if (queuedRef.current) {
          queuedRef.current = false;
          if (
            !conflictRef.current &&
            contentRef.current !== savedContentRef.current
          ) {
            void saveContent(contentRef.current);
          }
        }
      }
    },
    [organization.id, onSaved, openConflict, showToast],
  );

  useEffect(() => {
    if (conflictRef.current) return;
    if (content === savedContentRef.current) return;

    setStatus("dirty");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void saveContent(contentRef.current);
    }, 900);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content, saveContent]);

  useEffect(() => {
    const handlePageHide = () => {
      if (
        conflictRef.current ||
        contentRef.current === savedContentRef.current
      ) {
        return;
      }
      void additionalOrganizationApi
        .updateContent(organization.id, {
          content: contentRef.current || null,
          expected_version: savedVersionRef.current,
        })
        .catch(() => {
          // Falha silenciosa: a tela já está sendo encerrada.
        });
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [organization.id]);

  const handleBlur = () => {
    if (conflictRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    void saveContent(contentRef.current);
  };

  const handleReload = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setContent(remoteContent);
    contentRef.current = remoteContent;
    savedContentRef.current = remoteContent;
    savedVersionRef.current = remoteVersion;
    conflictRef.current = false;
    setConflictOpen(false);
    setStatus("idle");
    onReload();
  };

  const handleOverwrite = async () => {
    setConflictLoading(true);
    try {
      const saved = await additionalOrganizationApi.updateContent(
        organization.id,
        {
          content: contentRef.current || null,
          expected_version: remoteVersion,
        },
      );
      savedContentRef.current = contentRef.current;
      savedVersionRef.current = saved.content_version;
      conflictRef.current = false;
      setConflictOpen(false);
      setStatus("saved");
      onSaved(saved, contentRef.current);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const current = await additionalOrganizationApi.getById(
          organization.id,
        );
        setRemoteContent(current.content ?? "");
        setRemoteVersion(current.content_version);
        showToast(
          "O texto foi alterado novamente. Escolha uma opção para continuar.",
          "error",
        );
      } else {
        showToast(
          error instanceof Error
            ? error.message
            : "Erro ao sobrescrever anotações",
          "error",
        );
      }
    } finally {
      setConflictLoading(false);
    }
  };

  const statusContent = {
    idle: null,
    dirty: "Alterações não salvas",
    saving: "Salvando...",
    saved: "Salvo",
    error: "Não foi possível salvar",
    conflict: "Conflito de edição",
  }[status];

  return (
    <div>
      <div className="mb-3 flex min-h-[24px] items-center justify-between gap-3">
        <p
          className={`flex items-center gap-1.5 text-xs ${
            status === "error" || status === "conflict"
              ? "text-rose-600 dark:text-rose-400"
              : "text-slate-500 dark:text-slate-400"
          }`}
          aria-live="polite"
        >
          {status === "saving" && (
            <Loader2 size={14} className="animate-spin" />
          )}
          {status === "saved" && (
            <CheckCircle2 size={14} className="text-emerald-500" />
          )}
          {(status === "error" || status === "conflict") && (
            <AlertCircle size={14} />
          )}
          {statusContent}
        </p>

        <button
          type="button"
          onClick={() => void saveContent(contentRef.current)}
          disabled={
            status === "saving" ||
            status === "conflict" ||
            content === savedContentRef.current
          }
          className="flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
        >
          <Save size={15} />
          Salvar agora
        </button>
      </div>

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onBlur={handleBlur}
        maxLength={20000}
        placeholder="Comece a escrever suas observações, ideias e planos..."
        aria-label="Anotações da organização"
        className="min-h-[55vh] w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-4 text-base leading-relaxed text-slate-900 placeholder-slate-400 shadow-brand-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20"
      />

      <div className="mt-2 flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{content.length > 0 ? `${content.length} caracteres` : ""}</span>
        {content.length >= 18000 && (
          <span>{20000 - content.length} restantes</span>
        )}
      </div>

      <ContentConflictDialog
        open={conflictOpen}
        loading={conflictLoading}
        onReload={handleReload}
        onOverwrite={() => void handleOverwrite()}
      />
    </div>
  );
}
