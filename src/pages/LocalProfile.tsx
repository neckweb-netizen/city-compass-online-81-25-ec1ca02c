import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaById } from '@/hooks/useEmpresas';
import { useFavoritos } from '@/hooks/useFavoritos';
import { useEmpresaAvaliacoes, useEmpresaEstatisticasAvaliacoes, useUsuarioJaAvaliou } from '@/hooks/useAvaliacoes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmpresaActions } from '@/components/empresa/EmpresaActions';
import { EmpresaLocation } from '@/components/empresa/EmpresaLocation';
import { EmpresaProdutos } from '@/components/empresa/EmpresaProdutos';
import { SolicitarResponsabilidadeDialog } from '@/components/empresa/SolicitarResponsabilidadeDialog';
import { SolicitarPropriedadeAviso } from '@/components/empresa/SolicitarPropriedadeAviso';
import { InfluencerProfile } from '@/components/empresa/InfluencerProfile';
import { AvaliacaoModal } from '@/components/empresa/AvaliacaoModal';
import { BannerSection } from '@/components/home/BannerSection';
import { RadioPlayer } from '@/components/ui/radio-player';
import { ArrowLeft, Calendar, CalendarCheck, Camera, Heart, Info, MessageCircle, Package, Radio, Share2, Star, Ticket, Verified } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { EmpresaEventos } from '@/components/empresa/EmpresaEventos';
import { EmpresaCupons } from '@/components/empresa/EmpresaCupons';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { AgendamentoForm } from '@/components/agendamento/AgendamentoForm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const EmpresaProfile = () => {
  const params = useParams<{ id?: string; slug?: string }>();
  const empresaParam = params.id || params.slug;

  const { data: empresa, isLoading, error } = useEmpresaById(empresaParam || '');
  const { data: avaliacoes } = useEmpresaAvaliacoes(empresa?.id || '');
  const { data: estatisticas } = useEmpresaEstatisticasAvaliacoes(empresa?.id || '');

  const { data: adminAtribuido } = useQuery({
    queryKey: ['empresa-admin-check', empresa?.id],
    queryFn: async () => {
      if (!empresa?.id) return false;
      const { data, error } = await supabase
        .from('usuario_empresa_admin')
        .select('id')
        .eq('empresa_id', empresa.id)
        .eq('ativo', true)
        .limit(1);
      if (error) throw error;
      return data && data.length > 0;
    },
    enabled: !!empresa?.id,
  });

  const { verificarFavorito, adicionarFavorito, removerFavorito } = useFavoritos();
  const [avaliacaoModalOpen, setAvaliacaoModalOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [agendamentoModalOpen, setAgendamentoModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { data: jaAvaliou } = useUsuarioJaAvaliou(empresa?.id || '', user?.id);

  const isFavorito = empresa ? verificarFavorito(empresa.id) : false;

  const handleAvaliar = () => {
    if (!user) {
      toast({
        title: 'Acesso necessário',
        description: 'Você precisa estar logado para avaliar uma empresa.',
        variant: 'destructive',
      });
      return;
    }
    if (jaAvaliou) {
      toast({
        title: 'Avaliação já existe',
        description: 'Você já avaliou esta empresa anteriormente.',
        variant: 'destructive',
      });
      return;
    }
    setAvaliacaoModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !empresa) {
    console.error('❌ EmpresaProfile - Erro ou empresa não encontrada:', { error, empresa, empresaParam });
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground mb-2">Empresa não encontrada</h2>
          <p className="text-muted-foreground">A empresa que você procura não existe ou foi removida.</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const images = [empresa.imagem_capa_url].filter(Boolean);

  const handleFavorite = () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    if (isFavorito) removerFavorito.mutate(empresa.id);
    else adicionarFavorito.mutate(empresa.id);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: empresa.nome,
          text: `Confira o perfil de ${empresa.nome}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: 'Link copiado!', description: 'O link do perfil foi copiado para a área de transferência.' });
      }
    } catch {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: 'Link copiado!', description: 'O link do perfil foi copiado para a área de transferência.' });
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível compartilhar ou copiar o link.', variant: 'destructive' });
      }
    }
  };

  const precisaResponsavel = user && profile && profile.tipo_conta === 'usuario' && empresa.usuario_id !== user.id;
  const empresaSemProprietario = (!empresa.usuario_id || empresa.usuario_id === null) && !adminAtribuido;

  const isRadio = empresa.categorias?.nome === 'Rádios' && empresa.link_radio;
  const isInfluencer = empresa.categorias?.nome === 'Influencers';
  const permiteAgendamento = Boolean(empresa.agendamentos_ativo);

  const tabTriggerClass =
    'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 ' +
    'data-[state=active]:bg-white data-[state=active]:text-violet-700 ' +
    'dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-violet-300 ' +
    'data-[state=active]:shadow-lg font-medium px-3 py-2.5 md:px-4 md:py-3 rounded-xl ' +
    'transition-all duration-300 flex flex-col items-center justify-center gap-1 border border-white/20 ' +
    'data-[state=active]:border-white/90 whitespace-nowrap min-w-[60px] md:min-w-0 flex-shrink-0';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFavorite}
              disabled={adicionarFavorito.isPending || removerFavorito.isPending}
              className="bg-card text-card-foreground border-border shadow-sm hover:bg-accent"
              aria-label={isFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart className={`h-4 w-4 ${isFavorito ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="bg-card text-card-foreground border-border shadow-sm hover:bg-accent"
              aria-label="Compartilhar empresa"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="relative h-64 md:h-80 bg-gradient-to-br from-violet-100 via-purple-100 to-indigo-100 dark:from-violet-950/50 dark:via-purple-950/40 dark:to-indigo-950/50">
          {empresa.imagem_capa_url ? (
            <img src={empresa.imagem_capa_url} alt={empresa.nome} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="h-16 w-16 text-violet-600/50 dark:text-violet-300/50" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent flex items-end">
            <div className="p-6 text-white w-full">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white">{empresa.nome}</h1>
                    <div className="flex items-center flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {empresa.categorias?.nome}
                      </Badge>
                      {empresa.verificado && (
                        <Badge className="bg-emerald-500/90 text-white border-emerald-400">
                          <Verified className="h-3 w-3 mr-1" />
                          Verificado
                        </Badge>
                      )}
                      {empresa.destaque && (
                        <Badge className="bg-yellow-500/90 text-white border-yellow-400">⭐ Destaque</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {estatisticas && estatisticas.total_avaliacoes > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-lg">{estatisticas.media_avaliacoes}</span>
                    </div>
                    <span className="text-white/80">({estatisticas.total_avaliacoes} avaliações)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <BannerSection secao="locais" />

        <div className="md:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="fixed top-20 right-4 z-40 bg-card/95 text-card-foreground backdrop-blur-sm border-border shadow-lg rounded-full w-10 h-10 p-0 hover:bg-accent"
            aria-label="Compartilhar empresa"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="container mx-auto px-4 py-6 space-y-6">
          <SolicitarPropriedadeAviso
            nomeEmpresa={empresa.nome}
            empresaId={empresa.id}
            empresaUsuarioId={empresa.usuario_id}
          />

          {isInfluencer ? (
            <InfluencerProfile
              empresa={empresa}
              avaliacoes={avaliacoes}
              estatisticas={estatisticas}
              onAvaliacaoClick={() => setAvaliacaoModalOpen(true)}
              onEventosClick={() => {}}
            />
          ) : (
            <Card className="overflow-hidden border-border bg-card text-card-foreground shadow-lg">
              <Tabs defaultValue={isRadio ? 'radio' : 'informacoes'} className="w-full">
                <div className="rounded-t-lg bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-1 shadow-sm dark:from-violet-700 dark:via-purple-700 dark:to-indigo-700">
                  <TabsList className="w-full h-auto border-none bg-transparent p-1 md:p-2">
                    {isRadio ? (
                      <div className="flex justify-center w-full">
                        <TabsTrigger
                          value="radio"
                          className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-violet-700 dark:data-[state=active]:bg-slate-950 dark:data-[state=active]:text-violet-300 data-[state=active]:shadow-lg font-semibold px-6 py-3 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 min-w-[120px] border border-white/20 data-[state=active]:border-white/90"
                        >
                          <Radio className="h-4 w-4" />
                          <span className="text-sm">Rádio</span>
                        </TabsTrigger>
                      </div>
                    ) : (
                      <div className="w-full overflow-x-auto scrollbar-hide">
                        <div className="flex gap-1 md:grid md:grid-cols-4 md:gap-2 px-1 pb-1">
                          <TabsTrigger value="informacoes" className={tabTriggerClass}>
                            <Info className="h-4 w-4 md:h-5 md:w-5" />
                            <span className="text-xs md:text-sm">Info</span>
                          </TabsTrigger>
                          <TabsTrigger value="produtos" className={tabTriggerClass}>
                            <Package className="h-4 w-4 md:h-5 md:w-5" />
                            <span className="text-xs md:text-sm">Produtos</span>
                          </TabsTrigger>
                          <TabsTrigger value="eventos" className={tabTriggerClass}>
                            <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                            <span className="text-xs md:text-sm">Eventos</span>
                          </TabsTrigger>
                          <TabsTrigger value="cupons" className={tabTriggerClass}>
                            <Ticket className="h-4 w-4 md:h-5 md:w-5" />
                            <span className="text-xs md:text-sm">Cupons</span>
                          </TabsTrigger>
                        </div>
                      </div>
                    )}
                  </TabsList>
                </div>

                <div className="p-4 md:p-6">
                  {!isRadio && (
                    <>
                      <TabsContent value="informacoes" className="space-y-6 mt-0">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="lg:col-span-2 space-y-6">
                            <EmpresaActions empresa={empresa} />

                            {permiteAgendamento && (
                              <Card className="p-4 bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 border-violet-200 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-indigo-950/30 dark:border-violet-900/60">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-violet-600 dark:bg-violet-500 rounded-full flex items-center justify-center shadow-sm">
                                      <CalendarCheck className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-violet-900 dark:text-violet-100">Agendar Serviço</h3>
                                      <p className="text-sm text-violet-700 dark:text-violet-300">Marque seu horário online</p>
                                    </div>
                                  </div>
                                  <Dialog open={agendamentoModalOpen} onOpenChange={setAgendamentoModalOpen}>
                                    <DialogTrigger asChild>
                                      <Button className="bg-violet-600 hover:bg-violet-700 text-white dark:bg-violet-500 dark:hover:bg-violet-600">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Agendar
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-lg">
                                      <DialogHeader>
                                        <DialogTitle>Agendar Serviço</DialogTitle>
                                        <DialogDescription>Escolha o serviço, a data e um dos horários disponíveis.</DialogDescription>
                                      </DialogHeader>
                                      <AgendamentoForm
                                        empresaId={empresa.id}
                                        empresaNome={empresa.nome}
                                        onSuccess={() => setAgendamentoModalOpen(false)}
                                      />
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </Card>
                            )}

                            <EmpresaLocation empresa={empresa} />
                            {images.length > 0 && <Card />}
                          </div>

                          <div className="space-y-6">
                            {precisaResponsavel && (
                              <SolicitarResponsabilidadeDialog empresaId={empresa.id} empresaNome={empresa.nome} />
                            )}

                            <Card>
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                  <h2 className="text-xl font-semibold text-foreground">Avaliações & Comentários</h2>
                                  <Button variant="outline" size="sm" onClick={handleAvaliar}>
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Avaliar
                                  </Button>
                                </div>

                                {estatisticas && estatisticas.total_avaliacoes > 0 ? (
                                  <>
                                    <div className="flex items-center space-x-6 mb-6 p-4 bg-muted/50 rounded-lg">
                                      <div className="text-center">
                                        <div className="flex items-center space-x-1 mb-1">
                                          <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                                          <span className="font-bold text-2xl">{estatisticas.media_avaliacoes}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{estatisticas.total_avaliacoes} avaliações</p>
                                      </div>

                                      <div className="flex-1">
                                        <div className="space-y-2">
                                          {[5, 4, 3, 2, 1].map((stars) => {
                                            const count = estatisticas.distribuicao_notas[stars] || 0;
                                            const percentage = estatisticas.total_avaliacoes > 0
                                              ? (count / estatisticas.total_avaliacoes) * 100
                                              : 0;
                                            return (
                                              <div key={stars} className="flex items-center space-x-2">
                                                <span className="text-sm w-3">{stars}</span>
                                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                <div className="flex-1 bg-muted rounded-full h-2">
                                                  <div className="bg-yellow-400 h-2 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }} />
                                                </div>
                                                <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-4">
                                      {avaliacoes?.slice(0, 3).map((avaliacao) => (
                                        <div key={avaliacao.id} className="border-b pb-4 last:border-b-0">
                                          <div className="flex items-start space-x-3 mb-3">
                                            <div className="w-10 h-10 bg-violet-100 dark:bg-violet-950/50 rounded-full flex items-center justify-center">
                                              <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                                                {avaliacao.usuarios?.nome?.charAt(0).toUpperCase() || 'U'}
                                              </span>
                                            </div>
                                            <div className="flex-1">
                                              <div className="flex items-center justify-between mb-1">
                                                <p className="font-medium">{avaliacao.usuarios?.nome || 'Usuário'}</p>
                                                <span className="text-xs text-muted-foreground">{new Date(avaliacao.criado_em).toLocaleDateString('pt-BR')}</span>
                                              </div>
                                              <div className="flex items-center space-x-1 mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                  <Star key={i} className={`h-4 w-4 ${i < avaliacao.nota ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                                                ))}
                                              </div>
                                              {avaliacao.comentario && <p className="text-sm text-muted-foreground">{avaliacao.comentario}</p>}
                                              {avaliacao.resposta_empresa && (
                                                <div className="mt-2 p-2 bg-primary/5 border-l-4 border-primary rounded-r">
                                                  <p className="text-xs font-medium text-primary mb-1">Resposta da empresa:</p>
                                                  <p className="text-xs text-muted-foreground">{avaliacao.resposta_empresa}</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}

                                      {avaliacoes && avaliacoes.length > 3 && (
                                        <div className="text-center pt-4 border-t">
                                          <Button variant="outline" size="sm">Ver todas as {avaliacoes.length} avaliações</Button>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center py-8">
                                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-muted-foreground mb-3">Ainda não há avaliações para esta empresa.</p>
                                    <Button variant="outline" onClick={handleAvaliar}>Seja o primeiro a avaliar</Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="produtos" className="mt-0">
                        <EmpresaProdutos empresaId={empresa.id} />
                      </TabsContent>

                      <TabsContent value="eventos" className="mt-0">
                        <EmpresaEventos />
                      </TabsContent>

                      <TabsContent value="cupons" className="mt-0">
                        <EmpresaCupons empresaId={empresa.id} />
                      </TabsContent>
                    </>
                  )}

                  {empresa.categorias?.nome === 'Rádios' && empresa.link_radio && (
                    <TabsContent value="radio" className="mt-0">
                      <div className="flex flex-col items-center justify-center py-8 space-y-6">
                        <div className="text-center space-y-2">
                          <h2 className="text-2xl font-bold text-foreground">Ouça Nossa Rádio</h2>
                          <p className="text-muted-foreground">Escute {empresa.nome} ao vivo, onde quer que você esteja!</p>
                        </div>
                        <RadioPlayer radioUrl={empresa.link_radio} stationName={empresa.nome} className="w-full max-w-lg" />
                      </div>
                    </TabsContent>
                  )}
                </div>
              </Tabs>
            </Card>
          )}
        </div>
      </main>

      {empresa && (
        <AvaliacaoModal
          open={avaliacaoModalOpen}
          onOpenChange={setAvaliacaoModalOpen}
          empresaId={empresa.id}
          empresaNome={empresa.nome}
        />
      )}

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
};

export default EmpresaProfile;
