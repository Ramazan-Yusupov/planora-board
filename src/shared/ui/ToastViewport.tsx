import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";

import { cn } from "@/shared/lib";

export type ToastTone = "success" | "info" | "warning" | "danger";

export type ToastMessage = Readonly<{
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
}>;

type ToastViewportProps = Readonly<{
  toasts: readonly ToastMessage[];
  onDismiss: (toastId: string) => void;
}>;

const toastToneClasses: Record<ToastTone, string> = {
  success: "border-emerald-300/25 bg-emerald-950/80 text-emerald-50",
  info: "border-sky-300/25 bg-slate-950/88 text-sky-50",
  warning: "border-amber-300/25 bg-amber-950/82 text-amber-50",
  danger: "border-red-300/25 bg-red-950/82 text-red-50",
};

const toastIconClasses: Record<ToastTone, string> = {
  success: "text-emerald-300",
  info: "text-sky-300",
  warning: "text-amber-300",
  danger: "text-red-300",
};

const toastIcons = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  danger: XCircle,
} satisfies Record<ToastTone, typeof Info>;

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Уведомления"
      aria-live="polite"
      className="pointer-events-none fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-3 z-70 flex w-[min(calc(100vw-1.5rem),24rem)] flex-col gap-2 sm:right-5"
      role="region"
    >
      {toasts.map((toast) => {
        const tone = toast.tone ?? "info";
        const Icon = toastIcons[tone];

        return (
          <article
            key={toast.id}
            className={cn(
              "pointer-events-auto flex min-h-16 items-start gap-3 rounded-xl border p-3 shadow-2xl backdrop-blur-xl",
              toastToneClasses[tone],
            )}
            role="status"
          >
            <Icon
              aria-hidden="true"
              className={cn("mt-0.5 shrink-0", toastIconClasses[tone])}
              size={18}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{toast.title}</p>
              {toast.description ? (
                <p className="mt-1 line-clamp-2 text-xs leading-5 opacity-78">
                  {toast.description}
                </p>
              ) : null}
            </div>
            <button
              aria-label="Закрыть уведомление"
              className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-current/70 transition hover:bg-white/10 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55"
              type="button"
              onClick={() => onDismiss(toast.id)}
            >
              <X aria-hidden="true" size={16} />
            </button>
          </article>
        );
      })}
    </section>
  );
}
