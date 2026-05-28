import { MessageSquarePlus, MessageSquareText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/Skeleton";
import type { ChatResponse } from "@/types/finance";

interface ChatSidebarProps {
  chats: ChatResponse[];
  activeId?: string;
  loading: boolean;
  onNewChat: () => void;
}

export function ChatSidebar({ chats, activeId, loading, onNewChat }: ChatSidebarProps) {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Chats</h2>
        <button
          onClick={onNewChat}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          title="Novo chat"
        >
          <MessageSquarePlus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center">
            <MessageSquareText size={32} className="text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nenhum chat ainda
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Convide alguém para começar
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {chats.map((chat) => {
              const isActive = chat.id === activeId;
              return (
                <button
                  key={chat.id}
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                    isActive ? "bg-sky-50 dark:bg-sky-900/20" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                      {chat.participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {chat.participant.name}
                      </p>
                      {chat.last_message && (
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {chat.last_message}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
