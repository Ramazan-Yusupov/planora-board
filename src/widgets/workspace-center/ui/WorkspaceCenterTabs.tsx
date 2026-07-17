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
  const activeLabel = tabs.find((tab) => tab.id === activeTab)?.label ?? "Раздел";

  return (
    <>
      <style>
        {`
          @media (min-width: 640px) {
            .workspace-center-tabs-mobile {
              display: none !important;
            }
          }

          @media (max-width: 639.98px) {
            .workspace-center-tabs-desktop {
              display: none !important;
            }
          }
        `}
      </style>

      <label className="workspace-center-tabs-mobile block">
        <span className="sr-only">Раздел Workspace Center</span>
        <select
          aria-label={`Раздел Workspace Center: ${activeLabel}`}
          className="h-11 w-full rounded-xl border border-white/10 bg-control px-3 text-sm font-semibold text-text outline-none transition focus-visible:ring-2 focus-visible:ring-accent"
          value={activeTab}
          onChange={(event) => onSelect(event.target.value as WorkspaceCenterTab)}
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </label>

      <div className="workspace-center-tabs-desktop flex flex-wrap gap-2">
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
    </>
  );
}
