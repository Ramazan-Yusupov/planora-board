import { loadImage } from "../lib/loadImage";
import { revokeImageUrl } from "../lib/revokeImageUrl";
import type { ImageFile } from "./types";

type ImageFileListener = () => void;

let files: ImageFile[] = [];
const loadedImages = new Map<string, HTMLImageElement>();
const sourceByImageId = new Map<string, string>();
const loadingImages = new Map<string, Promise<HTMLImageElement>>();
const listeners = new Set<ImageFileListener>();

function notify() {
  listeners.forEach((listener) => listener());
}

function hasCachedSource(id: string, source: string) {
  return sourceByImageId.get(id) === source && loadedImages.has(id);
}

function cacheImage(id: string, source: string, image: HTMLImageElement) {
  sourceByImageId.set(id, source);
  loadedImages.set(id, image);
}

function clearCachedImage(id: string) {
  sourceByImageId.delete(id);
  loadedImages.delete(id);
  loadingImages.delete(id);
}

/** In-memory registry plus a cache that lets the Canvas draw persisted image sources. */
export const imageFileStore = {
  get() {
    return files;
  },

  add(file: ImageFile) {
    files = [...files, file];

    if (file.image) {
      cacheImage(file.id, file.url, file.image);
    } else {
      void this.preload(file.id, file.url).catch(() => undefined);
    }

    notify();
  },

  getById(id: string) {
    return files.find((file) => file.id === id) ?? null;
  },

  getLoadedImage(id: string, source: string) {
    if (!hasCachedSource(id, source)) {
      void this.preload(id, source).catch(() => undefined);
      return null;
    }

    return loadedImages.get(id) ?? null;
  },

  preload(id: string, source: string) {
    if (hasCachedSource(id, source)) {
      return Promise.resolve(loadedImages.get(id) as HTMLImageElement);
    }

    const loading = loadingImages.get(id);
    if (loading && sourceByImageId.get(id) === source) {
      return loading;
    }

    clearCachedImage(id);
    sourceByImageId.set(id, source);

    const promise = loadImage(source)
      .then((image) => {
        // A newer source may have been requested for the same id while this
        // image was loading. Keep the current cache entry intact in that case.
        if (sourceByImageId.get(id) === source) {
          cacheImage(id, source, image);
          notify();
        }
        return image;
      })
      .catch((error: unknown) => {
        if (sourceByImageId.get(id) === source) {
          sourceByImageId.delete(id);
        }
        throw error;
      })
      .finally(() => {
        if (loadingImages.get(id) === promise) {
          loadingImages.delete(id);
        }
      });

    loadingImages.set(id, promise);
    return promise;
  },

  remove(id: string) {
    const file = files.find((item) => item.id === id);
    if (!file) return false;
    revokeImageUrl(file.url);
    clearCachedImage(id);
    files = files.filter((item) => item.id !== id);
    notify();
    return true;
  },

  clear() {
    files.forEach((file) => revokeImageUrl(file.url));
    files = [];
    loadedImages.clear();
    sourceByImageId.clear();
    loadingImages.clear();
    notify();
  },

  subscribe(listener: ImageFileListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

