
import React from 'react';
import { useCanalInformativo } from '@/hooks/useCanalInformativo';
import { NeonCard } from '@/components/ui/neon-card';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Image, Video, FileText, Trophy, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

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

const isImageUrl = (url: string) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  return imageExtensions.some(ext => url.toLowerCase().includes(ext));
};

export const LatestChannelPost = () => {
  const { items, loading } = useCanalInformativo();
  const navigate = useNavigate();

  if (loading || !items || items.length === 0) {
    return null;
  }

  const latestPost = items[0];

  const handleLinkClick = () => {
    if (latestPost.link_externo) {
      window.open(latestPost.link_externo, '_blank');
    }
  };

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-4">
      <NeonCard>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-2xl">📢</div>
              <CardTitle className="text-lg">Canal Informativo</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/canal-informativo')}
              className="text-primary hover:text-primary/80"
            >
              Ver todas
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <NeonCard className="border-0 bg-gradient-to-r from-muted/50 to-muted/30">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base line-clamp-2">{latestPost.titulo}</CardTitle>
                <Badge variant="outline" className="flex items-center gap-1 flex-shrink-0 ml-2">
                  {getTypeIcon(latestPost.tipo_conteudo)}
                  {getTypeLabel(latestPost.tipo_conteudo)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(latestPost.criado_em), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {latestPost.conteudo && (
                <p className="text-sm leading-relaxed line-clamp-3">{latestPost.conteudo}</p>
              )}

              {latestPost.tipo_conteudo === 'resultado_sorteio' && latestPost.resultado_sorteio && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Trophy className="w-4 h-4" />
                    <span>
                      Sorteio realizado em: {new Date(latestPost.resultado_sorteio.data_sorteio).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  {latestPost.resultado_sorteio.premios && latestPost.resultado_sorteio.premios.length > 0 && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="font-semibold">Prêmio</div>
                        <div className="font-semibold">Milhar</div>
                        <div className="font-semibold">Grupo</div>
                        {latestPost.resultado_sorteio.premios.slice(0, 2).map((premio, index) => (
                          <div key={index} className="contents">
                            <div className="text-primary font-medium">{premio.premio}</div>
                            <div className="font-mono font-bold">{premio.milhar || '-'}</div>
                            <div>{premio.grupo || '-'}</div>
                          </div>
                        ))}
                      </div>
                      {latestPost.resultado_sorteio.premios.length > 2 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          E mais {latestPost.resultado_sorteio.premios.length - 2} prêmios...
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {latestPost.url_midia && latestPost.tipo_conteudo !== 'resultado_sorteio' && isImageUrl(latestPost.url_midia) && (
                <div className="w-full h-32 bg-muted/30 rounded-lg overflow-hidden">
                  <img 
                    src={latestPost.url_midia} 
                    alt={latestPost.titulo}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {latestPost.link_externo && (
                <Button 
                  onClick={handleLinkClick}
                  className="w-full"
                  variant="default"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Saiba Mais
                </Button>
              )}
            </CardContent>
          </NeonCard>
        </CardContent>
      </NeonCard>
    </section>
  );
};
