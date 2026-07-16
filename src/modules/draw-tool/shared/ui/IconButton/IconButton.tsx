import { forwardRef } from "react";
import { Button } from "../Button/Button";
import type { IconButtonProps } from "./types";

/** Semantic alias for compact icon-only actions. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (props, ref) => <Button {...props} ref={ref} />,
);

IconButton.displayName = "IconButton";

