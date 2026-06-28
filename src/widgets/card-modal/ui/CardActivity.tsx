import { History } from "lucide-react";

import type { BoardActivity } from "@/entities/board";

function formatAbsoluteTime(timestamp: number): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatRelativeTime(timestamp: number): string {
  const differenceInSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (differenceInSeconds < 10) {
    return "только что";
  }

  if (differenceInSeconds < 60) {
    return `${differenceInSeconds} сек. назад`;
  }

  const differenceInMinutes = Math.floor(differenceInSeconds / 60);

  if (differenceInMinutes < 60) {
    return `${differenceInMinutes} мин. назад`;
  }

  const differenceInHours = Math.floor(differenceInMinutes / 60);

  if (differenceInHours < 24) {
    return `${differenceInHours} ч. назад`;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
  }).format(new Date(timestamp));
}

type CardActivityProps = Readonly<{
  activities: readonly BoardActivity[];
}>;

export function CardActivity({ activities }: CardActivityProps) {
  return (
    <section aria-labelledby="card-activity-title" className="space-y-3">
      <div className="flex items-center gap-2">
        <History aria-hidden="true" size={18} />
        <h3 id="card-activity-title" className="text-sm font-semibold text-text">
          Активность
        </h3>
      </div>

      {activities.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 bg-control/20 px-3 py-3 text-sm text-text-muted">
          История появится после первого изменения карточки.
        </p>
      ) : (
        <ol className="max-h-72 scrollbar-none space-y-2 overflow-y-auto pr-1" aria-label="История карточки">
          {activities.map((activity) => (
            <li
              key={activity.id}
              className="rounded-xl border border-white/10 bg-control/20 px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 text-sm leading-5 text-text">
                  <span className="font-semibold">{activity.actorName}</span>{" "}
                  {activity.message}
                </p>
                <time
                  className="shrink-0 text-xs text-text-muted"
                  dateTime={new Date(activity.createdAt).toISOString()}
                  title={formatAbsoluteTime(activity.createdAt)}
                >
                  {formatRelativeTime(activity.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
