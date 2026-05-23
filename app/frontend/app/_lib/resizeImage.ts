export async function resizeImageIfNeeded(file: File, maxDimension = 2048): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  let img: ImageBitmap;
  try {
    img = await createImageBitmap(file);
  } catch {
    return file;
  }

  const { width, height } = img;

  if (width <= maxDimension && height <= maxDimension) {
    img.close();
    return file;
  }

  const ratio = Math.min(maxDimension / width, maxDimension / height);
  const canvas = new OffscreenCanvas(
    Math.round(width * ratio),
    Math.round(height * ratio),
  );
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  img.close();

  const blob = await canvas.convertToBlob({ type: file.type });
  return new File([blob], file.name, { type: file.type });
}
