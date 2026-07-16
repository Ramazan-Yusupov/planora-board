/** Vite-resolved URLs for assets that may be used by future UI surfaces. */
export const ASSET_URLS = {
  logo: new URL("./logo.svg", import.meta.url).href,
  cursors: {
    eraser: new URL("./cursors/cursor-eraser.svg", import.meta.url).href,
    hand: new URL("./cursors/cursor-hand.svg", import.meta.url).href,
    pencil: new URL("./cursors/cursor-pencil.svg", import.meta.url).href,
  },
  icons: {
    arrow: new URL("./icons/arrow.svg", import.meta.url).href,
    download: new URL("./icons/download.svg", import.meta.url).href,
    image: new URL("./icons/image.svg", import.meta.url).href,
    redo: new URL("./icons/redo.svg", import.meta.url).href,
    select: new URL("./icons/select.svg", import.meta.url).href,
    undo: new URL("./icons/undo.svg", import.meta.url).href,
    zoomIn: new URL("./icons/zoom-in.svg", import.meta.url).href,
    zoomOut: new URL("./icons/zoom-out.svg", import.meta.url).href,
  },
} as const;

