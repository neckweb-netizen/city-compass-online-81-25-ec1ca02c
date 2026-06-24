import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Users, MapPin, Mail, Instagram, Youtube, Twitter, Globe, Calendar, Star } from 'lucide-react';

interface InfluencerProfileProps {
  empresa: any;
  avaliacoes?: any[];
  estatisticas?: any;
  onAvaliacaoClick?: () => void;
  onEventosClick?: () => void;
}

export const InfluencerProfile = ({ 
  empresa, 
  avaliacoes = [], 
  estatisticas,
  onAvaliacaoClick,
  onEventosClick 
}: InfluencerProfileProps) => {
  const parseRedesSociais = (site?: string) => {
    if (!site) return {};
    
    try {
      if (site.startsWith('{')) {
        return JSON.parse(site);
      }
      return { site };
    } catch {
      return { site };
    }
  };

  const redesSociais = parseRedesSociais(empresa.site);

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'youtube': return <Youtube className="w-4 h-4" />;
      case 'twitter': case 'x': return <Twitter className="w-4 h-4" />;
      case 'tiktok': return <Globe className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Perfil */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {empresa.imagem_capa_url && (
              <img
                src={empresa.imagem_capa_url}
                alt={empresa.nome}
                className="w-32 h-32 rounded-full object-cover mx-auto md:mx-0"
              />
            )}
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{empresa.nome}</h1>
                {empresa.verificado && (
                  <Badge variant="default" className="bg-blue-600 w-fit">
                    <Star className="w-3 h-3 mr-1" />
                    Verificado
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-4 text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Criador de Conteúdo
                </span>
                {empresa.endereco && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {empresa.endereco}
                  </span>
                )}
              </div>

              {empresa.descricao && (
                <p className="text-muted-foreground mb-4">{empresa.descricao}</p>
              )}

              {/* Estatísticas */}
              {estatisticas && (
                <div className="flex justify-center md:justify-start gap-6 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{estatisticas.total_avaliacoes || 0}</div>
                    <div className="text-sm text-muted-foreground">Avaliações</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {estatisticas.media_avaliacoes ? Number(estatisticas.media_avaliacoes).toFixed(1) : '0.0'}
                    </div>
                    <div className="text-sm text-muted-foreground">Média</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{estatisticas.total_visualizacoes || 0}</div>
                    <div className="text-sm text-muted-foreground">Visualizações</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redes Sociais e Contato */}
      {Object.keys(redesSociais).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Onde me encontrar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(redesSociais).map(([platform, url]) => (
                <a
                  key={platform}
                  href={typeof url === 'string' ? url : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {getSocialIcon(platform)}
                  <div>
                    <div className="font-medium capitalize">{platform}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {typeof url === 'string' ? url : 'N/A'}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contato Direto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Contato Profissional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {empresa.telefone && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  📱
                </div>
                <div>
                  <div className="font-medium">Telefone</div>
                  <div className="text-sm text-muted-foreground">{empresa.telefone}</div>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium">Email</div>
                <div className="text-sm text-muted-foreground">
                  Entre em contato através do perfil
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Interagir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {onAvaliacaoClick && (
            <Button 
              onClick={onAvaliacaoClick} 
              className="w-full" 
              variant="outline"
            >
              <Star className="w-4 h-4 mr-2" />
              Deixar Avaliação
            </Button>
          )}
          
          {onEventosClick && (
            <Button 
              onClick={onEventosClick} 
              className="w-full"
              variant="outline"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Ver Eventos
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Avaliações Recentes */}
      {avaliacoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {avaliacoes.slice(0, 3).map((avaliacao) => (
                <div key={avaliacao.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{avaliacao.usuarios?.nome || 'Usuário'}</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${
                            i < avaliacao.nota ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                  {avaliacao.comentario && (
                    <p className="text-sm text-muted-foreground">{avaliacao.comentario}</p>
                  )}
                  <Separator />
                </div>
              ))}
              
              {avaliacoes.length > 3 && onAvaliacaoClick && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={onAvaliacaoClick}
                >
                  Ver todas as avaliações ({avaliacoes.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};