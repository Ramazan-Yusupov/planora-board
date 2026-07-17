import type { ReactNode } from "react";

import { cn } from "@/shared/lib";

type ToolSurfaceHeaderProps = Readonly<{
  description: string;
  icon: ReactNode;
  title: string;
  action?: ReactNode;
}>;

type ToolSurfaceRowProps = ToolSurfaceHeaderProps &
  Readonly<{
    children?: ReactNode;
  }>;

type StatusPillProps = Readonly<{
  children: ReactNode;
  tone?: "accent" | "danger" | "muted" | "success" | "warning";
}>;

type EmptyStateProps = Readonly<{
  description: string;
  icon: ReactNode;
  title: string;
}>;

const statusPillClasses: Record<NonNullable<StatusPillProps["tone"]>, string> = {
  accent: "border-accent/25 bg-accent/12 text-accent",
  danger: "border-red-400/20 bg-red-500/10 text-red-200",
  muted: "border-white/10 bg-control text-text-muted",
  success: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
  warning: "border-amber-300/25 bg-amber-400/10 text-amber-100",
};

export function ToolIcon({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-control text-accent">
      {children}
    </span>
  );
}

export function ToolSurfaceHeader({
  action,
  description,
  icon,
  title,
}: ToolSurfaceHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 gap-3">
        <ToolIcon>{icon}</ToolIcon>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-text">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-text-muted">{description}</p>
        </div>
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function ToolSurfaceRow({
  action,
  children,
  description,
  icon,
  title,
}: ToolSurfaceRowProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/20 p-3">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-control text-accent">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-text">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-text-muted">{description}</p>
          {children}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

export function StatusPill({ children, tone = "muted" }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-1 text-center text-xs font-semibold leading-none",
        statusPillClasses[tone],
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ description, icon, title }: EmptyStateProps) {
  return (
    <div className="text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-100">
        {icon}
      </span>
      <h3 className="mt-3 text-sm font-semibold text-text">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-text-muted">
        {description}
      </p>
    </div>
  );
}
