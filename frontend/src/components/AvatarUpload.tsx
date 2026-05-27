import { useRef, useState } from "react";
import { Camera, Loader2, Trash2, Upload } from "lucide-react";

interface AvatarUploadProps {
  currentUrl: string | null;
  userName: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
  loading: boolean;
}

export function AvatarUpload({
  currentUrl,
  userName,
  onUpload,
  onRemove,
  loading,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const currentSrc = preview || currentUrl;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);

    try {
      await onUpload(file);
    } finally {
      setUploading(false);
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      await onRemove();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative h-24 w-24 cursor-pointer overflow-hidden rounded-full ring-4 transition-all ${
          dragOver
            ? "ring-sky-400 scale-105"
            : "ring-slate-100 dark:ring-slate-800"
        }`}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        aria-label="Alterar foto de perfil"
      >
        {currentSrc ? (
          <img
            src={currentSrc}
            alt={userName}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-200 text-2xl font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
            {userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
        )}

        {(loading || uploading) && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 size={22} className="animate-spin text-white" />
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors hover:bg-black/30">
          <Camera size={20} className="text-white opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100" />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInput}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading || uploading}
          className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <Upload size={14} />
          Alterar foto
        </button>

        {currentUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={loading || uploading}
            className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            <Trash2 size={14} />
            Remover
          </button>
        )}
      </div>
    </div>
  );
}
