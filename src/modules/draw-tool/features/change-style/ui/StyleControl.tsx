import type { ReactNode } from "react";

type StyleControlProps = {
  children: ReactNode;
  label: string;
};

/** Consistent semantic wrapper for named controls inside style panels. */
export function StyleControl({ children, label }: StyleControlProps) {
  return (
    <section className="space-y-2" aria-label={label}>
      <p className="m-0 text-sm font-medium text-text">{label}</p>
      {children}
    </section>
  );
}

