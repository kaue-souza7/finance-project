interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-skeleton rounded-md bg-slate-200 dark:bg-slate-700 ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <Skeleton className="mb-3 h-3 w-20" />
      <Skeleton className="h-7 w-32" />
    </div>
  );
}
