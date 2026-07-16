import { ExternalLink, Link2 } from "lucide-react";
import { Button } from "@/modules/draw-tool/shared/ui";

type LinkSectionProps = { link?: string; onChange: (value: string) => void };

export function LinkSection({ link, onChange }: LinkSectionProps) {
  return (
    <section className="space-y-2 border-t border-border pt-4">
      <div className="flex items-center gap-2 text-sm font-medium text-text"><Link2 size={16} /> Ссылка</div>
      <input
        className="h-9 w-full rounded-md border border-border bg-control px-2 text-xs text-text outline-none placeholder:text-text-muted focus:border-accent"
        defaultValue={link ?? ""}
        key={link ?? "empty"}
        onBlur={(event) => onChange(event.currentTarget.value)}
        placeholder="https://example.com"
      />
      {link && (
        <Button className="flex w-full items-center justify-center gap-2 rounded-md bg-control px-2 py-2 text-xs text-text hover:bg-surface-muted" onClick={() => window.open(link, "_blank", "noopener,noreferrer")} type="button">
          <ExternalLink size={14} /> Открыть ссылку
        </Button>
      )}
      <p className="m-0 text-[11px] leading-4 text-text-muted">Открытие на холсте: Ctrl/Cmd + клик по объекту.</p>
    </section>
  );
}

