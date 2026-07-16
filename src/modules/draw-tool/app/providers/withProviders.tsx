import type { ComponentType } from "react";
import { AppProviders } from "./AppProviders";

/** Wraps the root screen with the app-level provider boundary. */
export function withProviders<Props extends object>(
  Component: ComponentType<Props>,
) {
  function WithProviders(props: Props) {
    return (
      <AppProviders>
        <Component {...props} />
      </AppProviders>
    );
  }

  WithProviders.displayName = `withProviders(${Component.displayName ?? Component.name ?? "Component"})`;

  return WithProviders;
}

