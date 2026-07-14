"use client";

import { useState } from "react";

import { TextField } from "@/shared/ui";

type BoardTitleInputProps = Readonly<{
  title: string;
  disabled: boolean;
  onCommit: (title: string) => void;
}>;

export function BoardTitleInput({ title, disabled, onCommit }: BoardTitleInputProps) {
  const [draft, setDraft] = useState(title);

  const commit = (value: string) => {
    const nextTitle = value.trim() || "Новый проект";
    setDraft(nextTitle);

    if (nextTitle !== title) {
      onCommit(nextTitle);
    }
  };

  return (
    <TextField
      id="board-title"
      className="h-auto border-transparent bg-transparent px-2 py-2 text-base font-semibold hover:border-white/10 focus:bg-control sm:px-3 sm:text-lg"
      disabled={disabled}
      value={draft}
      onBlur={(event) => commit(event.currentTarget.value)}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }

        if (event.key === "Escape") {
          event.preventDefault();
          setDraft(title);
          event.currentTarget.blur();
        }
      }}
    />
  );
}
