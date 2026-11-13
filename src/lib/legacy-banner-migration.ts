import { supabase } from '@/integrations/supabase/client';
import { prepareImageForUpload } from '@/lib/image-upload-optimization';

export type LegacyBannerReference = {
  id: string;
  titulo: string;
  imagem_url?: string | null;
  tipo_midia?: 'imagem' | 'video' | 'codigo' | null;
};

export type BannerMigrationResult = {
  updated: number;
  savedBytes: number;
  skipped: number;
  errors: string[];
};

const STORAGE_ORIGIN = 'https://uyleozhwzngnvyddfvni.supabase.co';
const PUBLIC_PREFIX = '/storage/v1/object/public/banners/';
const MAX_LEGACY_FILE_BYTES = 8 * 1024 * 1024;

/** Migrate only PNGs from our own public Storage bucket. Never fetch arbitrary URLs. */
export function legacyBannerPath(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.origin !== STORAGE_ORIGIN || !parsed.pathname.startsWith(PUBLIC_PREFIX)) return null;
    if (parsed.search || parsed.hash) return null;
    const path = decodeURIComponent(parsed.pathname.slice(PUBLIC_PREFIX.length));
    if (!path || path.includes('..') || !/^[\w./-]+\.png$/i.test(path)) return null;
    return path;
  } catch {
    return null;
  }
}

export function isLegacyBanner(banner: LegacyBannerReference): boolean {
  return (banner.tipo_midia == null || banner.tipo_midia === 'imagem') &&
    legacyBannerPath(banner.imagem_url) !== null;
}

/** Export a recoverable manifest BEFORE touching database records. */
export function downloadLegacyBannerBackup(items: readonly LegacyBannerReference[]): void {
  const records = items.filter(isLegacyBanner).map((item) => ({
    id: item.id,
    titulo: item.titulo,
    imagem_url_original: item.imagem_url,
  }));
  const document = {
    descricao: 'Backup original de URLs de banners PNG do Saj Tem',
    criado_em: new Date().toISOString(),
    instrucoes: 'Para restaurar, abra o banner no painel administrativo e cole a imagem_url_original deste arquivo.',
    banners: records,
  };
  const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  try {
    const a = window.document.createElement('a');
    a.href = href;
    a.download = 'sajtem-backup-banners-png.json';
    window.document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
}

type Progress = (completed: number, total: number, summary: BannerMigrationResult) => void;

/**
 * Sequential migration; one converted WebP per unique source.
 * - verifies stored WebP bytes before any DB change;
 * - compare-and-swap avoids overwriting a banner edited during conversion;
 * - originals are not overwritten or deleted;
 * - partial failures are reported, never silently ignored.
 */
export async function migrateLegacyBanners(
  banners: readonly LegacyBannerReference[],
  onProgress: Progress,
): Promise<BannerMigrationResult> {
  const selected = banners.filter(isLegacyBanner);
  const sources = new Map<string, LegacyBannerReference[]>();
  for (const banner of selected) {
    const key = banner.imagem_url!;
    sources.set(key, [...(sources.get(key) ?? []), banner]);
  }
  const result: BannerMigrationResult = { updated: 0, savedBytes: 0, skipped: 0, errors: [] };
  let completed = 0;

  for (const [url, refs] of sources) {
    try {
      const oldPath = legacyBannerPath(url);
      if (!oldPath) throw new Error('Origem não autorizada para migração.');

      // Uses authenticated Supabase Storage API; actual policies require admin MFA.
      const { data: original, error: downloadError } = await supabase.storage.from('banners').download(oldPath);
      if (downloadError || !original) throw new Error('Não foi possível ler o PNG original.');
      if (original.size <= 0 || original.size > MAX_LEGACY_FILE_BYTES)
        throw new Error('Arquivo excede o limite seguro de migração (8 MB).');

      const sourceFile = new File([original], oldPath.split('/').pop() || 'banner.png', { type: 'image/png' });
      const optimized = await prepareImageForUpload(sourceFile, 'banner', 5);
      if (optimized.type !== 'image/webp' || optimized.size >= original.size) {
        result.skipped += refs.length;
        continue;
      }

      // Independent object: rollback is always possible using the original URL.
      const newPath = `otimizados/${crypto.randomUUID()}.webp`;
      const { error: uploadError } = await supabase.storage.from('banners').upload(newPath, optimized, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: false,
      });
      if (uploadError) throw new Error('Upload WebP não autorizado. Verifique o MFA administrativo.');

      const { data: verified, error: verificationError } = await supabase.storage.from('banners').download(newPath);
      if (verificationError || !verified || verified.size !== optimized.size)
        throw new Error('O novo WebP não passou na verificação de armazenamento.');

      const { data: publicUrl } = supabase.storage.from('banners').getPublicUrl(newPath);
      for (const banner of refs) {
        // Preserve any other field (title, order, active, section, links).
        const { data, error } = await supabase
          .from('banners_publicitarios')
          .update({ imagem_url: publicUrl.publicUrl })
          .eq('id', banner.id)
          .eq('imagem_url', url)
          .select('id');
        if (error || !data || data.length !== 1) {
          result.errors.push(`${banner.titulo}: não foi possível atualizar o registro sem conflito.`);
          continue;
        }
        result.updated += 1;
        result.savedBytes += original.size - optimized.size;
      }
    } catch (error) {
      result.errors.push(`${refs.map((item) => item.titulo).join(', ')}: ${error instanceof Error ? error.message : 'Falha desconhecida'}`);
    } finally {
      completed += refs.length;
      onProgress(completed, selected.length, { ...result, errors: [...result.errors] });
    }
  }
  return result;
}
