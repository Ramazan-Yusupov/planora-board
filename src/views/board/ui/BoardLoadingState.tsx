import { Grid, Text } from "@/shared/ui";

export function BoardLoadingState() {
  return (
    <Grid
      tag="main"
      className="h-dvh min-h-dvh place-items-center bg-canvas px-4 text-text"
    >
      <Text
        aria-busy="true"
        aria-live="polite"
        text="Загружаем доску…"
        variant="loading"
      />
    </Grid>
  );
}
