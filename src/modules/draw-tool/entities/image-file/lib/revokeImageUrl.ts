/** Releases an object URL after an image is removed from the in-memory registry. */
export function revokeImageUrl(url: string) {
  if (url.startsWith("blob:")) URL.revokeObjectURL(url);
}

