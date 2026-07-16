import type { BoardElement } from "@/modules/draw-tool/entities/element";

const LIBRARY_STORAGE_KEY = "drawtool.componentLibrary.v1";
const SNAPSHOT_STORAGE_KEY = "drawtool.snapshots.v1";
const BRAND_KIT_STORAGE_KEY = "drawtool.brandKit.v1";

export type LibraryItem = {
  id: string;
  name: string;
  elements: BoardElement[];
  createdAt: number;
};

export type SnapshotItem = {
  id: string;
  name: string;
  createdAt: number;
  elements: BoardElement[];
};

function readStorageArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorageArray<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

export function readLibrary() {
  return readStorageArray<LibraryItem>(LIBRARY_STORAGE_KEY);
}

export function writeLibrary(items: LibraryItem[]) {
  writeStorageArray(LIBRARY_STORAGE_KEY, items);
}

export function readSnapshots() {
  return readStorageArray<SnapshotItem>(SNAPSHOT_STORAGE_KEY);
}

export function writeSnapshots(items: SnapshotItem[]) {
  writeStorageArray(SNAPSHOT_STORAGE_KEY, items);
}

export function saveBrandKit(brand: Record<string, string>) {
  localStorage.setItem(BRAND_KIT_STORAGE_KEY, JSON.stringify(brand));
}

