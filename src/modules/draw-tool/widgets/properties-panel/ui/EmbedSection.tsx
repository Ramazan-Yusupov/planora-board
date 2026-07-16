import { Globe2 } from "lucide-react";

type EmbedSectionProps = {
  url: string;
  onChange: (url: string) => void;
};

export function EmbedSection({ url, onChange }: EmbedSectionProps) {
  return (
    <section className="space-y-2 border-t border-border pt-4">
      <div className="flex items-center gap-2 text-sm font-medium text-text">
        <Globe2 size={16} /> Встроенная страница
      </div>
      <input
        className="h-10 w-full rounded-md border border-border bg-control px-3 text-sm text-text outline-none placeholder:text-text-muted focus:border-accent"
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder="https://example.com"
        type="url"
        value={url}
      />
      <p className="m-0 text-xs leading-5 text-text-muted">Карточка сохраняет адрес. Содержимое страницы можно открыть по ссылке после экспорта.</p>
    </section>
  );
}

