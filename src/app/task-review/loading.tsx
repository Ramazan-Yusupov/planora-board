import { Grid, Text } from "@/shared/ui";

export default function Loading() {
  return (
    <Grid
      tag="main"
      className="h-dvh min-h-dvh place-items-center bg-canvas px-4 text-text"
    >
      <Text
        aria-busy="true"
        aria-live="polite"
        text="Проверяем задачи…"
        variant="loading"
      />
    </Grid>
  );
}
