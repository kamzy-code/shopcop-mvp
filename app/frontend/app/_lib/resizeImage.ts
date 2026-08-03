const JPEG_QUALITY_STEPS = [0.92, 0.82, 0.72, 0.62, 0.5];

interface ResizeOptions {
  maxDimension?: number;
  maxBytes?: number;
}

/**
 * Caps an image's dimensions via canvas, then — if it's still over `maxBytes` — iteratively
 * re-encodes as JPEG at decreasing quality until it fits or the quality floor is reached.
 * Non-image files and files already within both limits pass through untouched.
 */
export async function resizeImageIfNeeded(
  file: File,
  options: ResizeOptions = {}
): Promise<File> {
  const { maxDimension = 2048, maxBytes = Infinity } = options;

  if (!file.type.startsWith('image/')) return file;

  let img: ImageBitmap;
  try {
    img = await createImageBitmap(file);
  } catch {
    return file;
  }

  const { width, height } = img;
  const overDimension = width > maxDimension || height > maxDimension;
  const overSize = file.size > maxBytes;

  if (!overDimension && !overSize) {
    img.close();
    return file;
  }

  const ratio = overDimension ? Math.min(maxDimension / width, maxDimension / height) : 1;
  const canvas = new OffscreenCanvas(Math.round(width * ratio), Math.round(height * ratio));
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  img.close();

  const supportsQuality = file.type === 'image/jpeg' || file.type === 'image/webp';
  let blob = await canvas.convertToBlob(
    supportsQuality ? { type: file.type, quality: JPEG_QUALITY_STEPS[0] } : { type: file.type }
  );

  if (blob.size > maxBytes) {
    // Re-encode as JPEG at decreasing quality (also covers formats like PNG that ignore quality).
    for (const quality of JPEG_QUALITY_STEPS) {
      blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
      if (blob.size <= maxBytes) break;
    }
  }

  const outName = blob.type === file.type ? file.name : file.name.replace(/\.\w+$/, '.jpg');
  return new File([blob], outName, { type: blob.type });
}
