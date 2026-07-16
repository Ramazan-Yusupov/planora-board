/** Loads a browser image source and resolves after dimensions are known. */
export function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Не удалось загрузить изображение."));
    image.src = source;
  });
}

