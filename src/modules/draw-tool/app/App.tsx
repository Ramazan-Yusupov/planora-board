import { withProviders } from "@/modules/draw-tool/app/providers";
import { AppRouter } from "@/modules/draw-tool/app/routes";

export const App = withProviders(AppRouter);

