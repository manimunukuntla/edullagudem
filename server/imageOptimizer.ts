import sharp from 'sharp';

/**
 * Optimizes base64 Data URL images on the server.
 * Resizes large dimensions to maxDim and applies high-quality progressive JPEG compression.
 * Ensures stored JSON files remain lightweight (<150KB) and API responses remain ultra-fast.
 */
export async function optimizeBase64Image(
  dataUrl: string | undefined | null,
  maxDim = 900,
  quality = 82
): Promise<string> {
  if (!dataUrl || typeof dataUrl !== 'string') return '';
  const trimmed = dataUrl.trim();
  if (!trimmed.startsWith('data:image/')) {
    // It's a standard web URL (e.g. Unsplash or external link), return as-is
    return trimmed;
  }

  const match = trimmed.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return trimmed;

  try {
    const buffer = Buffer.from(match[2], 'base64');
    const optimized = await sharp(buffer)
      .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, progressive: true })
      .toBuffer();

    return `data:image/jpeg;base64,${optimized.toString('base64')}`;
  } catch (err) {
    console.warn('Failed to optimize image with sharp, keeping original:', err);
    return trimmed;
  }
}
