import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BannerCodeRender } from '@/components/home/BannerCodeRender';
import { cn } from '@/lib/utils';

interface ToolBannerProps {
  secao: string;
  className?: string;
}

interface ToolBannerItem {
  id: string;
  titulo?: string | null;
  imagem_url?: string | null;
  imagem?: string | null;
  link_url?: string | null;
  link_destino?: string | null;
  tipo_midia?: 'imagem' | 'video' | 'codigo' | null;
  codigo_html?: string | null;
}

export const ToolBanner = ({ secao, className }: ToolBannerProps) => {
  const { data: banners = [] } = useQuery({
    queryKey: ['banners-publicitarios', secao],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners_publicitarios')
        .select('*')
        .eq('secao', secao)
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) throw error;
      return (data ?? []) as ToolBannerItem[];
    },
  });

  if (banners.length === 0) return null;

  return (
    <section
      aria-label="Publicidade"
      className={cn('w-full space-y-3 my-4', className)}
    >
      {banners.map((banner) => {
        const mediaUrl = banner.imagem_url || banner.imagem || '';
        const linkUrl = banner.link_url || banner.link_destino;

        const media = banner.tipo_midia === 'codigo' && banner.codigo_html ? (
          <BannerCodeRender
            codigoHtml={banner.codigo_html}
            className="min-h-16 bg-card p-2 text-center"
          />
        ) : banner.tipo_midia === 'video' && mediaUrl ? (
          <video
            src={mediaUrl}
            controls
            playsInline
            preload="metadata"
            className="w-full h-auto max-h-[220px] object-cover"
          />
        ) : mediaUrl ? (
          <img
            src={mediaUrl}
            alt={banner.titulo || 'Banner de anúncio'}
            loading="lazy"
            decoding="async"
            className="w-full h-auto max-h-[160px] sm:max-h-[220px] object-cover"
          />
        ) : null;

        if (!media) return null;

        const sharedClassName = 'block w-full rounded-2xl overflow-hidden shadow-sm border border-border/60 bg-card';
        return linkUrl ? (
          <a
            key={banner.id}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={`${sharedClassName} hover:opacity-95 transition-opacity`}
            aria-label={banner.titulo || 'Abrir anúncio'}
          >
            {media}
          </a>
        ) : (
          <div key={banner.id} className={sharedClassName}>
            {media}
          </div>
        );
      })}
    </section>
  );
};
