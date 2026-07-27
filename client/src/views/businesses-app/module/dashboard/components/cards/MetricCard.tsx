import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger" | "info";
};

const toneClasses = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-sky-100 text-sky-700",
};

export const MetricCard = ({
  title,
  value,
  description,
  icon: Icon,
  tone = "default",
}: Props) => {
  return (
    <article className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-md ${toneClasses[tone]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
};
