/**
 * Prepares user-uploaded images locally. Existing media URLs are never replaced.
 * Only use a converted file when it is smaller than the source.
 */
export type ImageUploadProfile = 'banner' | 'icon' | 'cover' | 'general';

const PROFILES = {
  banner: { maxWidthOrHeight: 1600, maxSizeMB: 0.9, initialQuality: 0.86 },
  icon: { maxWidthOrHeight: 512, maxSizeMB: 0.18, initialQuality: 0.85 },
  cover: { maxWidthOrHeight: 1280, maxSizeMB: 0.65, initialQuality: 0.85 },
  general: { maxWidthOrHeight: 1600, maxSizeMB: 0.85, initialQuality: 0.84 },
} as const;

const SUPPORTED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

export async function prepareImageForUpload(
  file: File,
  profile: ImageUploadProfile = 'general',
  maxUploadMB = 5,
): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  if (!SUPPORTED.has(file.type)) {
    throw new Error('Formato de imagem não suportado. Use JPG, PNG, WebP, AVIF ou GIF.');
  }
  if (file.size <= 0 || file.size > MAX_SOURCE_BYTES) {
    throw new Error('A imagem precisa ter até 20 MB antes da otimização.');
  }

  const limitBytes = maxUploadMB * 1024 * 1024;
  const settings = PROFILES[profile];

  // Animation must remain animated; GIF transcoding to WebP can lose frames.
  if (file.type === 'image/gif') {
    if (file.size > limitBytes) {
      throw new Error('GIF animado excede o limite de envio. Reduza o GIF antes de enviar.');
    }
    return file;
  }

  // Already efficient, small images should not be decoded/re-encoded needlessly.
  if (file.size <= settings.maxSizeMB * 1024 * 1024 &&
      (file.type === 'image/webp' || file.type === 'image/avif')) {
    return file;
  }

  try {
    // Dynamic import keeps the compression library off the initial home bundle.
    const { default: imageCompression } = await import('browser-image-compression');
    const compressed = await imageCompression(file, {
      maxSizeMB: settings.maxSizeMB,
      maxWidthOrHeight: settings.maxWidthOrHeight,
      initialQuality: settings.initialQuality,
      useWebWorker: true,
      fileType: 'image/webp',
      preserveExif: false,
    });

    if (compressed.size > 0 && compressed.size < file.size && compressed.size <= limitBytes) {
      const filename = file.name.replace(/\.[^/.]+$/, '');
      return new File([compressed], filename + '.webp', { type: 'image/webp' });
    }
  } catch {
    // Continue with a valid original if encoding isn't supported by the device.
  }

  if (file.size > limitBytes) {
    throw new Error('Não foi possível reduzir esta imagem ao limite de envio. Use uma imagem menor.');
  }
  return file;
}
