/**
 * Inline image data URLs are stored in Postgres and embedded in SSR HTML.
 * Amplify Hosting Compute caps SSR responses at ~5.72MB, so oversized
 * base64 images on list/search pages cause request/response failures (413/504).
 */

/** Soft cap for images returned in list/search payloads (thumbnails). */
export const MAX_LIST_IMAGE_DATA_URL_LENGTH = 100_000;

/** Hard cap for images accepted by Server Actions / stored in the DB. */
export const MAX_STORED_IMAGE_DATA_URL_LENGTH = 350_000;

/** Source file size limit before client-side compression. */
export const MAX_IMAGE_UPLOAD_BYTES = 2 * 1024 * 1024;

export function isOversizedInlineImage(
  value: string | null | undefined,
  maxLength = MAX_LIST_IMAGE_DATA_URL_LENGTH
): boolean {
  return Boolean(value && value.length > maxLength);
}

type CompressOptions = {
  maxDimension?: number;
  quality?: number;
};

/**
 * Resize/compress an image File to a JPEG data URL suitable for DB + SSR.
 * Falls back to the original data URL only if it already fits the stored cap.
 */
export async function fileToCompressedDataUrl(
  file: File,
  options: CompressOptions = {}
): Promise<string> {
  const maxDimension = options.maxDimension ?? 640;
  const quality = options.quality ?? 0.72;

  const objectUrl = URL.createObjectURL(file);
  try {
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(
        1,
        maxDimension / Math.max(bitmap.width, bitmap.height)
      );
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not process image.");
      }
      ctx.drawImage(bitmap, 0, 0, width, height);

      let dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length > MAX_STORED_IMAGE_DATA_URL_LENGTH) {
        dataUrl = canvas.toDataURL("image/jpeg", Math.min(quality, 0.55));
      }
      if (dataUrl.length > MAX_STORED_IMAGE_DATA_URL_LENGTH) {
        throw new Error(
          "Image is still too large after compression. Try a smaller photo."
        );
      }
      return dataUrl;
    } finally {
      bitmap.close();
    }
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
