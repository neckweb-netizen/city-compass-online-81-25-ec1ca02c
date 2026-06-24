
import { useCanalInformativo } from '@/hooks/useCanalInformativo';
import type { CanalInformativoItem } from '@/hooks/useCanalInformativo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NeonCard } from '@/components/ui/neon-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/ui/share-button';
import { ExternalLink, Image, Video, FileText, Trophy, Share2, Copy, Download } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useShortUrls } from '@/hooks/useShortUrls';
import { VideoPlayerWithAd } from '@/components/ui/video-player-with-ad';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import html2canvas from 'html2canvas';
import { useRef, useState, useCallback } from 'react';

const getTypeIcon = (tipo: string) => {
  switch (tipo) {
    case 'video':
      return <Video className="w-4 h-4" />;
    case 'imagem':
      return <Image className="w-4 h-4" />;
    case 'resultado_sorteio':
      return <Trophy className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getTypeBadgeVariant = (tipo: string) => {
  switch (tipo) {
    case 'video':
      return 'destructive';
    case 'imagem':
      return 'secondary';
    case 'resultado_sorteio':
      return 'outline';
    default:
      return 'default';
  }
};

const getTypeLabel = (tipo: string) => {
  switch (tipo) {
    case 'noticia':
      return 'Notícia';
    case 'video':
      return 'Vídeo';
    case 'imagem':
      return 'Imagem';
    case 'resultado_sorteio':
      return 'Resultado de Sorteio';
    default:
      return tipo;
  }
};

const getYouTubeEmbedUrl = (url: string) => {
  console.log('Processing YouTube URL:', url);
  
  if (url.includes('/embed/')) {
    return url;
  }
  
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1].split('?')[0];
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  if (url.includes('youtube.com/watch')) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const videoId = urlParams.get('v');
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }
  
  return url;
};

const isYouTubeUrl = (url: string) => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

const isVideoUrl = (url: string) => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext)) || isYouTubeUrl(url);
};

const isImageUrl = (url: string) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  return imageExtensions.some(ext => url.toLowerCase().includes(ext));
};

const formatBrazilDateTime = (dateString: string) => {
  const date = new Date(dateString);
  // Ajustar para o fuso horário do Brasil (UTC-3)
  const brazilDate = new Date(date.getTime() - (3 * 60 * 60 * 1000));
  return format(brazilDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

const CanalInformativoItemComponent = ({ item }: { item: CanalInformativoItem }) => {
  const { toast } = useToast();
  const { createShortUrl } = useShortUrls();
  const sorteioRef = useRef<HTMLDivElement>(null);
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  
  console.log('Renderizando item do canal:', item);
  
  if (item.tipo_conteudo === 'resultado_sorteio') {
    console.log('Item é resultado de sorteio:', item.resultado_sorteio);
  }

  const getShareUrl = useCallback(async () => {
    if (shortUrl) return shortUrl;
    
    const originalUrl = `${window.location.origin}/canal-informativo?post=${item.id}`;
    
    try {
      const response = await createShortUrl({ original_url: originalUrl });
      if (response) {
        const newShortUrl = `${window.location.origin}/${response.short_code}`;
        setShortUrl(newShortUrl);
        return newShortUrl;
      }
    } catch (error) {
      console.error('Erro ao criar URL curta:', error);
    }
    
    return originalUrl;
  }, [shortUrl, item.id, createShortUrl]);

  const handleLinkClick = () => {
    if (item.link_externo) {
      try {
        const linkUrl = new URL(item.link_externo);
        const currentHost = window.location.host;
        
        // Se o link é do mesmo domínio, abrir na mesma aba
        if (linkUrl.host === currentHost) {
          window.location.href = item.link_externo;
        } else {
          // Se é externo, abrir em nova aba
          window.open(item.link_externo, '_blank');
        }
      } catch (error) {
        // Se não conseguir fazer parse da URL, assumir que é externo
        window.open(item.link_externo, '_blank');
      }
    }
  };

  const generateSorteioImage = async () => {
    if (!sorteioRef.current || item.tipo_conteudo !== 'resultado_sorteio') return null;

    try {
      const canvas = await html2canvas(sorteioRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      
      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png');
      });
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      return null;
    }
  };

  const handleShare = async () => {
    const shareUrl = await getShareUrl();
    const shareText = `${item.titulo} - Canal Informativo`;
    
    // Para resultados de sorteio, tentar compartilhar com imagem
    if (item.tipo_conteudo === 'resultado_sorteio' && navigator.share) {
      try {
        const imageBlob = await generateSorteioImage();
        
        if (imageBlob) {
          const file = new File([imageBlob], 'resultado-sorteio.png', { type: 'image/png' });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: shareText,
              text: item.resultado_sorteio?.data_sorteio 
                ? `Resultado do sorteio de ${new Date(item.resultado_sorteio.data_sorteio).toLocaleDateString('pt-BR')}`
                : shareText,
              url: shareUrl,
              files: [file],
            });
            return;
          }
        }
      } catch (error) {
        console.log('Erro ao compartilhar com imagem:', error);
      }
    }
    
    // Compartilhamento padrão
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: item.conteudo || shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Erro ao compartilhar:', error);
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleShareToWhatsApp = async () => {
    const shareUrl = await getShareUrl();
    let shareText = `*${item.titulo}*\n\n`;
    
    if (item.tipo_conteudo === 'resultado_sorteio' && item.resultado_sorteio) {
      shareText += `🏆 *Resultado do Sorteio*\n`;
      shareText += `📅 Data: ${new Date(item.resultado_sorteio.data_sorteio).toLocaleDateString('pt-BR')}\n\n`;
      
      if (item.resultado_sorteio.premios && item.resultado_sorteio.premios.length > 0) {
        shareText += `*Resultados:*\n`;
        item.resultado_sorteio.premios.forEach((premio) => {
          shareText += `${premio.premio} lugar: ${premio.milhar} (${premio.grupo})\n`;
        });
        shareText += `\n`;
      }
    } else if (item.conteudo) {
      shareText += `${item.conteudo}\n\n`;
    }
    
    shareText += `🔗 ${shareUrl}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareToFacebook = async () => {
    const shareUrl = await getShareUrl();
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank');
  };

  const handleDownloadImage = async () => {
    if (item.tipo_conteudo !== 'resultado_sorteio') return;
    
    try {
      const imageBlob = await generateSorteioImage();
      
      if (imageBlob) {
        const url = URL.createObjectURL(imageBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resultado-sorteio-${new Date(item.resultado_sorteio?.data_sorteio || new Date()).toLocaleDateString('pt-BR').replace(/\//g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Imagem baixada!",
          description: "A imagem do resultado foi salva em seus downloads.",
        });
      }
    } catch (error) {
      console.error('Erro ao baixar imagem:', error);
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível baixar a imagem.",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = await getShareUrl();
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copiado!",
        description: "O link da publicação foi copiado para a área de transferência.",
      });
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      toast({
        title: "Erro ao copiar link",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  const isVideo = item.url_midia ? isVideoUrl(item.url_midia) : false;
  const isImage = item.url_midia ? isImageUrl(item.url_midia) : false;

  return (
    <div className="tiktok-card tiktok-hover rounded-2xl overflow-hidden relative" id={`post-${item.id}`}>
      {/* Header Section */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm">
              {getTypeIcon(item.tipo_conteudo)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white line-clamp-2 leading-tight">{item.titulo}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getTypeBadgeVariant(item.tipo_conteudo)} className="text-xs">
                  {getTypeLabel(item.tipo_conteudo)}
                </Badge>
                <span className="text-xs text-white/60">
                  {formatBrazilDateTime(item.criado_em)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {item.conteudo && (
          <p className="text-sm text-white/80 leading-relaxed mb-4 line-clamp-3">
            {item.conteudo}
          </p>
        )}
      </div>


      {/* Content Area */}
      <div className="px-6 pb-6">
        {/* Lottery Results Section */}
        {item.tipo_conteudo === 'resultado_sorteio' && (
          <div ref={sorteioRef} className="tiktok-card rounded-xl p-6 bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-sm mb-4">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {item.resultado_sorteio?.data_sorteio 
                    ? `Sorteio de ${new Date(item.resultado_sorteio.data_sorteio).toLocaleDateString('pt-BR')}`
                    : 'Aguardando resultado'
                  }
                </span>
              </div>
              <h3 className="text-xl font-bold text-foreground">{item.titulo}</h3>
            </div>
            
            {item.resultado_sorteio?.premios && item.resultado_sorteio.premios.length > 0 ? (
              <div className="bg-background/50 backdrop-blur-sm rounded-xl overflow-hidden border border-border/20">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/10">
                      <TableHead className="font-bold text-center text-foreground bg-muted/50">Prêmio</TableHead>
                      <TableHead className="font-bold text-center text-foreground bg-muted/50">Milhar</TableHead>
                      <TableHead className="font-bold text-center text-foreground bg-muted/50">Grupo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {item.resultado_sorteio.premios.map((premio, index) => (
                      <TableRow key={index} className="text-center border-border/10 hover:bg-muted/30 transition-colors">
                        <TableCell className="font-bold text-primary py-4">{premio.premio}</TableCell>
                        <TableCell className="font-mono text-xl font-bold text-green-600 py-4">
                          {premio.milhar || '-'}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground py-4">{premio.grupo || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="tiktok-card rounded-xl p-8 text-center border-2 border-dashed border-muted-foreground/20">
                <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground font-medium mb-2">
                  Resultado ainda não disponível
                </p>
                <p className="text-xs text-muted-foreground">
                  Os números sorteados serão exibidos aqui assim que o sorteio for realizado.
                </p>
              </div>
            )}
            
            {/* Legal Disclaimer */}
            <div className="mt-6 p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/20 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                    Aviso Importante
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Informações de caráter jornalístico. O jogo do bicho é proibido no Brasil (Decreto-Lei nº 3.688/1941). Não incentivamos apostas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Media Content */}
        {item.url_midia && item.tipo_conteudo !== 'resultado_sorteio' && (
          <div className="space-y-4">
            {isImage && (
              <div className="rounded-xl overflow-hidden tiktok-shadow">
                <img 
                  src={item.url_midia} 
                  alt={item.titulo}
                  className="w-full h-64 object-cover"
                  onError={(e) => console.error('Erro ao carregar imagem:', e)}
                />
              </div>
            )}
            
            {isVideo && (
              <VideoPlayerWithAd
                videoUrl={item.url_midia}
                videoTitle={item.titulo}
                className="tiktok-shadow"
              />
            )}
          </div>
        )}

        {/* External Link */}
        {item.link_externo && (
          <div className="mt-4">
            <Button 
              onClick={handleLinkClick}
              className="w-full rounded-xl tiktok-gradient text-white hover:shadow-lg transition-all duration-300"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Saiba Mais
            </Button>
          </div>
        )}

        {/* Share Section */}
        <div className="mt-6 pt-4 border-t border-border/20">
          <p className="text-sm font-medium text-white mb-3">Compartilhar:</p>
          <div className="mb-3">
            <Button 
              onClick={handleShare}
              variant="outline"
              size="default"
              className="w-full rounded-xl h-12 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
            >
              <Share2 className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-12 text-white" />
              <span className="font-medium text-white">Compartilhar Publicação</span>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3 sm:hidden">
            <Button
              onClick={handleShareToWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl h-12 text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z"/>
              </svg>
              WhatsApp
            </Button>
            
            <Button
              onClick={handleShareToFacebook}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </Button>
          </div>
          
          <div className="flex gap-2 justify-center sm:hidden">
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="px-4 rounded-xl border-border hover:bg-muted/50 h-10"
              title="Copiar link da publicação"
            >
              <Copy className="w-4 h-4 mr-2" />
              <span className="text-sm">Copiar</span>
            </Button>
          </div>

          {/* Desktop layout */}
          <div className="hidden sm:flex items-center gap-3">
            <Button
              onClick={handleShareToWhatsApp}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl"
              size="sm"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z"/>
              </svg>
              WhatsApp
            </Button>
            
            <Button
              onClick={handleShareToFacebook}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              size="sm"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </Button>

            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="px-3 rounded-xl border-border hover:bg-muted/50"
              size="sm"
              title="Copiar link da publicação"
            >
              <Copy className="w-4 h-4 mr-1 text-white" />
              <span className="text-xs text-white">Copiar</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CanalInformativoList = () => {
  const { items, loading } = useCanalInformativo();

  console.log('Canal Informativo - Total de items:', items.length);
  console.log('Canal Informativo - Items completos:', items);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="tiktok-card rounded-2xl p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-muted rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-32 bg-muted rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="tiktok-card rounded-2xl p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma publicação encontrada</h3>
          <p className="text-sm text-muted-foreground">
            As últimas novidades do canal aparecerão aqui
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <CanalInformativoItemComponent item={item} />
        </div>
      ))}
      
      {/* Scroll indicator */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-muted-foreground text-sm">
          <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
          Você chegou ao final
        </div>
      </div>
    </div>
  );
};
