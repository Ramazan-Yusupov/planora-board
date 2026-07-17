import type { ReactNode } from "react";

import { cn } from "@/shared/lib";

export type WorkspaceCenterTab =
  | "workflows"
  | "preflight"
  | "roles"
  | "integrations"
  | "activity"
  | "marketplace";

export type WorkspaceCenterTabItem = Readonly<{
  id: WorkspaceCenterTab;
  icon: ReactNode;
  label: string;
}>;

export function WorkspaceCenterTabs({
  activeTab,
  tabs,
  onSelect,
}: Readonly<{
  activeTab: WorkspaceCenterTab;
  tabs: readonly WorkspaceCenterTabItem[];
  onSelect: (tab: WorkspaceCenterTab) => void;
}>) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          aria-pressed={activeTab === tab.id}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition",
            activeTab === tab.id
              ? "bg-accent text-accent-foreground"
              : "bg-control/55 text-text-muted hover:bg-control hover:text-text",
          )}
          type="button"
          onClick={() => onSelect(tab.id)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
