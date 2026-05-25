import { type LucideIcon } from "lucide-react";
import { Card, CardTitle, CardValue } from "./Card";

type Variant = "emerald" | "rose" | "sky" | "violet";

const variants: Record<Variant, { bar: string; icon: string }> = {
  emerald: {
    bar: "bg-emerald-500",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  rose: {
    bar: "bg-rose-500",
    icon: "text-rose-600 dark:text-rose-400",
  },
  sky: {
    bar: "bg-sky-500",
    icon: "text-sky-600 dark:text-sky-400",
  },
  violet: {
    bar: "bg-violet-500",
    icon: "text-violet-600 dark:text-violet-400",
  },
};

interface SummaryCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  variant: Variant;
}

export function SummaryCard({
  label,
  value,
  icon: Icon,
  variant,
}: SummaryCardProps) {
  const v = variants[variant];

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute left-0 top-0 h-full w-1 ${v.bar}`} />
      <div className="flex items-start justify-between pl-3">
        <div>
          <CardTitle>{label}</CardTitle>
          <CardValue className="mt-1">{value}</CardValue>
        </div>
        <div className={`rounded-lg p-2 ${v.bar}/10`}>
          <Icon size={20} className={v.icon} />
        </div>
      </div>
    </Card>
  );
}
