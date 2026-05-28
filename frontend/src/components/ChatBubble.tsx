import { Avatar } from "@/components/Avatar";
import type { MessageResponse } from "@/types/finance";

interface ChatBubbleProps {
  message: MessageResponse;
  isOwn: boolean;
  senderName: string;
  senderAvatarUrl?: string | null;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatBubble({ message, isOwn, senderName, senderAvatarUrl }: ChatBubbleProps) {
  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
      {!isOwn && (
        <Avatar src={senderAvatarUrl} name={senderName} size="xs" />
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
