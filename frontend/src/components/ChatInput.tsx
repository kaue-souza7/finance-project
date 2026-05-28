import { useRef } from "react";
import { Loader2, Send } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const content = textarea.value.trim();
    if (!content) return;

    textarea.value = "";
    textarea.style.height = "auto";

    onSend(content).catch(() => {
      // error handled by parent via toast
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  };

  return (
    <div className="flex items-end gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50">
      <textarea
        ref={textareaRef}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="Digite sua mensagem..."
        rows={1}
        disabled={disabled}
        className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white dark:placeholder-slate-500"
      />
      <button
        onClick={handleSend}
        disabled={disabled}
        className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white transition-colors hover:bg-sky-500 disabled:opacity-50"
        aria-label="Enviar mensagem"
      >
        {disabled ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
      </button>
    </div>
  );
}
