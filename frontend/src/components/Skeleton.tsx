interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <div
      className={`animate-skeleton rounded-md bg-slate-200 dark:bg-slate-700 ${className}`}
      style={style}
    />
  );
}

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <Skeleton className={`h-3 w-full ${className}`} />;
}

export function SkeletonTitle({ className = "" }: { className?: string }) {
  return <Skeleton className={`h-7 w-48 ${className}`} />;
}

export function SkeletonCircle({ size = 40 }: { size?: number }) {
  return (
    <Skeleton
      className="rounded-full shrink-0"
      style={{ width: size, height: size }}
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
