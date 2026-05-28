interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = "", ...rest }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: CardProps) {
  return (
    <div className={`mb-1 flex items-center gap-2 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: CardProps) {
  return (
    <p
      className={`text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 ${className}`}
    >
      {children}
    </p>
  );
}

export function CardValue({ children, className = "" }: CardProps) {
  return (
    <p
      className={`text-2xl font-bold text-slate-900 dark:text-white ${className}`}
    >
      {children}
    </p>
  );
}
