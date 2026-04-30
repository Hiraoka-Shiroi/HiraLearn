import type { Area } from 'react-easy-crop';

const TARGET_SIZE = 512;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Render the cropped region of `imageSrc` to a 512×512 JPEG Blob.
 * Used for avatar uploads — keeps payloads small (~30–80 KB).
 */
export async function getCroppedJpegBlob(
  imageSrc: string,
  pixelCrop: Area,
): Promise<{ blob: Blob; previewUrl: string }> {
  const image = await loadImage(imageSrc);

  const canvas = document.createElement('canvas');
  canvas.width = TARGET_SIZE;
  canvas.height = TARGET_SIZE;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas-2d-unavailable');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    TARGET_SIZE,
    TARGET_SIZE,
  );

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('canvas-toBlob-failed'))),
      'image/jpeg',
      0.85,
    );
  });

  const previewUrl = URL.createObjectURL(blob);
  return { blob, previewUrl };
}
