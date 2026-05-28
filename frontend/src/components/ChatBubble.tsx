import type { MessageResponse } from "@/types/finance";

interface ChatBubbleProps {
  message: MessageResponse;
  isOwn: boolean;
  senderName: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatBubble({ message, isOwn, senderName }: ChatBubbleProps) {
  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
      {!isOwn && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[11px] font-semibold text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
          {senderName.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="flex max-w-[80%] flex-col gap-0.5">
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isOwn
              ? "rounded-br-sm bg-sky-600 text-white"
              : "rounded-bl-sm bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white"
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.content}
          </p>
        </div>
        <p
          className={`px-1 text-[10px] ${
            isOwn ? "text-right text-slate-400" : "text-left text-slate-400"
          }`}
        >
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
