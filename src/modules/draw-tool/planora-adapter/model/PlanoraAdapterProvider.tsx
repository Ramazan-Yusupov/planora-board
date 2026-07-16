"use client";

import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";

import type { PlanoraTaskItem } from "./types";

type PlanoraAdapterValue = Readonly<{
  tasks: readonly PlanoraTaskItem[];
  onOpenTask?: (task: PlanoraTaskItem) => void;
}>;

const emptyAdapterValue: PlanoraAdapterValue = {
  tasks: [],
};

const PlanoraAdapterContext =
  createContext<PlanoraAdapterValue>(emptyAdapterValue);

type PlanoraAdapterProviderProps = PropsWithChildren<
  Readonly<{
    tasks: readonly PlanoraTaskItem[];
    onOpenTask?: (task: PlanoraTaskItem) => void;
  }>
>;

export function PlanoraAdapterProvider({
  children,
  tasks,
  onOpenTask,
}: PlanoraAdapterProviderProps) {
  const value = useMemo(
    () => ({
      tasks,
      onOpenTask,
    }),
    [onOpenTask, tasks],
  );

  return (
    <PlanoraAdapterContext.Provider value={value}>
      {children}
    </PlanoraAdapterContext.Provider>
  );
}

export function usePlanoraAdapter() {
  return useContext(PlanoraAdapterContext);
}
