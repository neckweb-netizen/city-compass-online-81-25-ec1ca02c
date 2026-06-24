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
import { MapPin, Phone, Globe, Clock, Star, Heart, Share2, MessageCircle, Calendar, Camera, ArrowLeft, Verified, Info, Package, Radio, Ticket, CalendarCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { EmpresaEventos } from '@/components/empresa/EmpresaEventos';
import { EmpresaCupons } from '@/components/empresa/EmpresaCupons';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { AgendamentoForm } from '@/components/agendamento/AgendamentoForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
const EmpresaProfile = () => {
  const params = useParams<{
    id?: string;
    slug?: string;
  }>();
  // Capturar tanto 'id' quanto 'slug' do parâmetro da URL
  const empresaParam = params.id || params.slug;
  console.log('🏢 EmpresaProfile - URL atual:', window.location.href);
  console.log('🏢 EmpresaProfile - Params completo:', params);
  console.log('🏢 EmpresaProfile - Parâmetro capturado (empresaParam):', empresaParam);
  console.log('🏢 EmpresaProfile - Tipo do parâmetro:', typeof empresaParam);
  const {
    data: empresa,
    isLoading,
    error
  } = useEmpresaById(empresaParam || '');
  const {
    data: avaliacoes
  } = useEmpresaAvaliacoes(empresa?.id || '');
  const {
    data: estatisticas
  } = useEmpresaEstatisticasAvaliacoes(empresa?.id || '');

  // Verificar se existe um admin atribuído para esta empresa
  const {
    data: adminAtribuido
  } = useQuery({
    queryKey: ['empresa-admin-check', empresa?.id],
    queryFn: async () => {
      if (!empresa?.id) return false;
      const {
        data,
        error
      } = await supabase.from('usuario_empresa_admin').select('id').eq('empresa_id', empresa.id).eq('ativo', true).limit(1);
      if (error) throw error;
      return data && data.length > 0;
    },
    enabled: !!empresa?.id
  });
  const {
    verificarFavorito,
    adicionarFavorito,
    removerFavorito
  } = useFavoritos();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [avaliacaoModalOpen, setAvaliacaoModalOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [agendamentoModalOpen, setAgendamentoModalOpen] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    user,
    profile
  } = useAuth();
  const {
    data: jaAvaliou
  } = useUsuarioJaAvaliou(empresa?.id || '', user?.id);
  useEffect(() => {
    console.log('🏢 EmpresaProfile - useEffect executado');
    console.log('🏢 EmpresaProfile - Parâmetro empresaParam:', empresaParam);
    console.log('🏢 EmpresaProfile - Estado Loading:', isLoading);
    console.log('🏢 EmpresaProfile - Erro:', error);
    console.log('🏢 EmpresaProfile - Dados da empresa:', empresa);
    if (empresa) {
      console.log('🏢 EmpresaProfile - Nome da empresa:', empresa.nome);
      console.log('🏢 EmpresaProfile - Slug da empresa:', empresa.slug);
      console.log('🏢 EmpresaProfile - ID da empresa:', empresa.id);
      console.log('🏢 EmpresaProfile - Categoria da empresa:', empresa.categorias?.nome);
      console.log('🏢 EmpresaProfile - Link rádio:', empresa.link_radio);
    }
  }, [empresaParam, isLoading, error, empresa]);
  const isFavorito = empresa ? verificarFavorito(empresa.id) : false;
  const handleAvaliar = () => {
    if (!user) {
      toast({
        title: "Acesso necessário",
        description: "Você precisa estar logado para avaliar uma empresa.",
        variant: "destructive"
      });
      return;
    }
    if (jaAvaliou) {
      toast({
        title: "Avaliação já existe",
        description: "Você já avaliou esta empresa anteriormente.",
        variant: "destructive"
      });
      return;
    }
    setAvaliacaoModalOpen(true);
  };
  if (isLoading) {
    console.log('🏢 EmpresaProfile - Exibindo estado de carregamento');
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>;
  }
  if (error || !empresa) {
    console.error('❌ EmpresaProfile - Erro ou empresa não encontrada:', {
      error,
      empresa,
      empresaParam
    });
    return <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground mb-2">Empresa não encontrada</h2>
          <p className="text-muted-foreground">A empresa que você procura não existe ou foi removida.</p>
          <p className="text-sm text-muted-foreground">ID/Slug pesquisado: {empresaParam || 'NENHUM PARÂMETRO CAPTURADO'}</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-red-600">
              <strong>Debug Info:</strong><br />
              URL: {window.location.href}<br />
              Params: {JSON.stringify(params)}<br />
              ID/Slug: {empresaParam || 'undefined'}<br />
              Error: {error?.message || 'Nenhum erro específico'}
            </p>
          </div>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>;
  }
  console.log('✅ EmpresaProfile - Renderizando perfil da empresa:', empresa.nome);
  const images = [empresa.imagem_capa_url].filter(Boolean);
  const handleFavorite = () => {
    if (!user) {
      // Se usuário não está logado, abrir modal de autenticação
      setAuthDialogOpen(true);
      return;
    }

    if (isFavorito) {
      removerFavorito.mutate(empresa.id);
    } else {
      adicionarFavorito.mutate(empresa.id);
    }
  };
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: empresa.nome,
          text: `Confira o perfil de ${empresa.nome}`,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copiado!",
          description: "O link do perfil foi copiado para a área de transferência."
        });
      }
    } catch (error) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copiado!",
          description: "O link do perfil foi copiado para a área de transferência."
        });
      } catch (clipboardError) {
        toast({
          title: "Erro",
          description: "Não foi possível compartilhar ou copiar o link.",
          variant: "destructive"
        });
      }
    }
  };
  const precisaResponsavel = user && profile && profile.tipo_conta === 'usuario' && empresa.usuario_id !== user.id;

  // Verifica se a empresa não tem proprietário E não tem admin atribuído
  const empresaSemProprietario = (!empresa.usuario_id || empresa.usuario_id === null) && !adminAtribuido;

  // Debug para verificar dados da empresa
  console.log('🏢 EmpresaProfile - Debug empresa sem proprietário:', {
    empresaUsuarioId: empresa.usuario_id,
    empresaUsuarioIdTipo: typeof empresa.usuario_id,
    userLoggedIn: !!user,
    empresaSemProprietario,
    empresaNome: empresa.nome
  });

  // Verifica se é uma rádio para mostrar apenas a aba de rádio
  const isRadio = empresa.categorias?.nome === 'Rádios' && empresa.link_radio;

  // Verifica se é um influencer para mostrar perfil específico
  const isInfluencer = empresa.categorias?.nome === 'Influencers';
  
  // Verifica se é uma empresa de serviços que permite agendamento
  const categoriasComAgendamento = ['Serviços', 'Manicure e Pedicure', 'Beleza', 'Saúde', 'Estética'];
  const permiteAgendamento = empresa.categorias?.nome && categoriasComAgendamento.includes(empresa.categorias.nome);
  return <div className="min-h-screen bg-background flex flex-col">
      {/* Header com navegação */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={handleFavorite} disabled={adicionarFavorito.isPending || removerFavorito.isPending}>
              <Heart className={`h-4 w-4 ${isFavorito ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1">
        {/* Header com imagem de capa */}
        <div className="relative h-64 md:h-80 bg-gradient-to-br from-blue-100 to-blue-200">
          {empresa.imagem_capa_url ? <img src={empresa.imagem_capa_url} alt={empresa.nome} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">
              <Camera className="h-16 w-16 text-blue-600/50" />
            </div>}
          
          {/* Overlay com informações básicas */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end">
            <div className="p-6 text-white w-full">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-foreground">{empresa.nome}</h1>
                    <div className="flex items-center flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {empresa.categorias?.nome}
                      </Badge>
                      {empresa.verificado && <Badge className="bg-green-500/90 text-white border-green-400">
                          <Verified className="h-3 w-3 mr-1" />
                          Verificado
                        </Badge>}
                      {empresa.destaque && <Badge className="bg-yellow-500/90 text-white border-yellow-400">
                          ⭐ Destaque
                        </Badge>}
                    </div>
                  </div>
                </div>
                
                {/* Rating */}
                {estatisticas && estatisticas.total_avaliacoes > 0 && <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-lg">
                        {estatisticas.media_avaliacoes}
                      </span>
                    </div>
                    <span className="text-white/80">
                      ({estatisticas.total_avaliacoes} avaliações)
                    </span>
                  </div>}
              </div>
            </div>
          </div>
        </div>

        {/* Banner publicitário - seção locais */}
        <BannerSection secao="locais" />

        {/* Botão de compartilhar flutuante apenas no mobile */}
        <div className="md:hidden">
          <Button variant="outline" size="sm" onClick={handleShare} className="fixed top-20 right-4 z-40 bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg rounded-full w-10 h-10 p-0">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Aviso para empresas sem proprietário */}
          <SolicitarPropriedadeAviso 
            nomeEmpresa={empresa.nome} 
            empresaId={empresa.id}
            empresaUsuarioId={empresa.usuario_id}
          />
          
          {/* Se for influencer, mostrar perfil específico */}
          {isInfluencer ? <InfluencerProfile empresa={empresa} avaliacoes={avaliacoes} estatisticas={estatisticas} onAvaliacaoClick={() => setAvaliacaoModalOpen(true)} onEventosClick={() => {}} // Pode implementar navegação para eventos se necessário
        /> : (/* Menu com fundo vermelho - Layout responsivo otimizado */
        <Card className="shadow-lg bg-white overflow-hidden">
            <Tabs defaultValue={isRadio ? "radio" : "informacoes"} className="w-full">
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-t-lg p-1">
                <TabsList className="bg-transparent border-none w-full h-auto p-1 md:p-2">
                  {isRadio ?
                // Se for rádio, mostrar apenas a aba de rádio centralizada
                <div className="flex justify-center">
                      <TabsTrigger value="radio" className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-lg font-semibold px-6 py-3 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 min-w-[120px] border border-white/20 data-[state=active]:border-white">
                        <Radio className="h-4 w-4" />
                        <span className="text-sm">Rádio</span>
                      </TabsTrigger>
                    </div> :
                // Layout responsivo otimizado para mobile
                <div className="w-full overflow-x-auto scrollbar-hide">
                      <div className="flex gap-1 md:grid md:grid-cols-4 md:gap-2 px-1 pb-1">
                        <TabsTrigger value="informacoes" className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-lg font-medium px-3 py-2.5 md:px-4 md:py-3 rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-1 border border-white/20 data-[state=active]:border-white whitespace-nowrap min-w-[60px] md:min-w-0 flex-shrink-0">
                          <Info className="h-4 w-4 md:h-5 md:w-5" />
                          <span className="text-xs md:text-sm">Info</span>
                        </TabsTrigger>
                        <TabsTrigger value="produtos" className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-lg font-medium px-3 py-2.5 md:px-4 md:py-3 rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-1 border border-white/20 data-[state=active]:border-white whitespace-nowrap min-w-[60px] md:min-w-0 flex-shrink-0">
                          <Package className="h-4 w-4 md:h-5 md:w-5" />
                          <span className="text-xs md:text-sm">Produtos</span>
                        </TabsTrigger>
                        <TabsTrigger value="eventos" className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-lg font-medium px-3 py-2.5 md:px-4 md:py-3 rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-1 border border-white/20 data-[state=active]:border-white whitespace-nowrap min-w-[60px] md:min-w-0 flex-shrink-0">
                          <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                          <span className="text-xs md:text-sm">Eventos</span>
                        </TabsTrigger>
                        <TabsTrigger value="cupons" className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-lg font-medium px-3 py-2.5 md:px-4 md:py-3 rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-1 border border-white/20 data-[state=active]:border-white whitespace-nowrap min-w-[60px] md:min-w-0 flex-shrink-0">
                          <Ticket className="h-4 w-4 md:h-5 md:w-5" />
                          <span className="text-xs md:text-sm">Cupons</span>
                        </TabsTrigger>
                      </div>
                    </div>}
                </TabsList>
              </div>

              <div className="p-4 md:p-6">
                {!isRadio && <>
                    <TabsContent value="informacoes" className="space-y-6 mt-0">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Coluna principal */}
                        <div className="lg:col-span-2 space-y-6">
                          {/* Ações rápidas */}
                          <EmpresaActions empresa={empresa} />

                          {/* Botão de Agendamento para empresas de serviço */}
                          {permiteAgendamento && (
                            <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                                    <CalendarCheck className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-green-800">Agendar Serviço</h3>
                                    <p className="text-sm text-green-600">Marque seu horário online</p>
                                  </div>
                                </div>
                                <Dialog open={agendamentoModalOpen} onOpenChange={setAgendamentoModalOpen}>
                                  <DialogTrigger asChild>
                                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                                      <Calendar className="w-4 h-4 mr-2" />
                                      Agendar
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-lg">
                                    <DialogHeader>
                                      <DialogTitle>Agendar Serviço</DialogTitle>
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

                          {/* Localização e contato */}
                          <EmpresaLocation empresa={empresa} />

                          {/* Galeria de fotos */}
                          {images.length > 0 && <Card>
                              
                            </Card>}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                          {/* Aviso para solicitar responsabilidade */}
                          {precisaResponsavel && <SolicitarResponsabilidadeDialog empresaId={empresa.id} empresaNome={empresa.nome} />}

                          {/* Avaliações */}
                          <Card>
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-foreground">Avaliações & Comentários</h2>
                                <Button variant="outline" size="sm" onClick={handleAvaliar}>
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Avaliar
                                </Button>
                              </div>
                              
                              {estatisticas && estatisticas.total_avaliacoes > 0 ? <>
                                  <div className="flex items-center space-x-6 mb-6 p-4 bg-muted/50 rounded-lg">
                                    <div className="text-center">
                                      <div className="flex items-center space-x-1 mb-1">
                                        <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                                        <span className="font-bold text-2xl">
                                          {estatisticas.media_avaliacoes}
                                        </span>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {estatisticas.total_avaliacoes} avaliações
                                      </p>
                                    </div>
                                    
                                    <div className="flex-1">
                                      <div className="space-y-2">
                                        {[5, 4, 3, 2, 1].map(stars => {
                                    const count = estatisticas.distribuicao_notas[stars] || 0;
                                    const percentage = estatisticas.total_avaliacoes > 0 ? count / estatisticas.total_avaliacoes * 100 : 0;
                                    return <div key={stars} className="flex items-center space-x-2">
                                              <span className="text-sm w-3">{stars}</span>
                                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                              <div className="flex-1 bg-muted rounded-full h-2">
                                                <div className="bg-yellow-400 h-2 rounded-full transition-all duration-300" style={{
                                          width: `${percentage}%`
                                        }} />
                                              </div>
                                              <span className="text-xs text-muted-foreground w-8 text-right">
                                                {count}
                                              </span>
                                            </div>;
                                  })}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-4">
                                    {avaliacoes?.slice(0, 3).map(avaliacao => <div key={avaliacao.id} className="border-b pb-4 last:border-b-0">
                                        <div className="flex items-start space-x-3 mb-3">
                                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-medium text-blue-600">
                                              {avaliacao.usuarios?.nome?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                              <p className="font-medium">{avaliacao.usuarios?.nome || 'Usuário'}</p>
                                              <span className="text-xs text-muted-foreground">
                                                {new Date(avaliacao.criado_em).toLocaleDateString('pt-BR')}
                                              </span>
                                            </div>
                                            <div className="flex items-center space-x-1 mb-2">
                                              {[...Array(5)].map((_, i) => <Star key={i} className={`h-4 w-4 ${i < avaliacao.nota ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />)}
                                            </div>
                                            {avaliacao.comentario && <p className="text-sm text-muted-foreground">
                                                {avaliacao.comentario}
                                              </p>}
                                            {avaliacao.resposta_empresa && <div className="mt-2 p-2 bg-primary/5 border-l-4 border-primary rounded-r">
                                                <p className="text-xs font-medium text-primary mb-1">Resposta da empresa:</p>
                                                <p className="text-xs text-muted-foreground">{avaliacao.resposta_empresa}</p>
                                              </div>}
                                          </div>
                                        </div>
                                      </div>)}
                                    
                                    {avaliacoes && avaliacoes.length > 3 && <div className="text-center pt-4 border-t">
                                        <Button variant="outline" size="sm">
                                          Ver todas as {avaliacoes.length} avaliações
                                        </Button>
                                      </div>}
                                  </div>
                                </> : <div className="text-center py-8">
                                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                  <p className="text-muted-foreground mb-3">Ainda não há avaliações para esta empresa.</p>
                                  <Button variant="outline" onClick={handleAvaliar}>
                                    Seja o primeiro a avaliar
                                  </Button>
                                </div>}
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
                  </>}

                {/* Aba da rádio - sempre visível se for rádio */}
                {empresa.categorias?.nome === 'Rádios' && empresa.link_radio && <TabsContent value="radio" className="mt-0">
                    <div className="flex flex-col items-center justify-center py-8 space-y-6">
                      <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-foreground">Ouça Nossa Rádio</h2>
                        <p className="text-muted-foreground">
                          Escute {empresa.nome} ao vivo, onde quer que você esteja!
                        </p>
                      </div>
                      
                      <RadioPlayer radioUrl={empresa.link_radio} stationName={empresa.nome} className="w-full max-w-lg" />
                    </div>
                  </TabsContent>}
              </div>
            </Tabs>
          </Card>)}
        </div>
      </main>

      {/* Modal de Avaliação */}
      {empresa && <AvaliacaoModal open={avaliacaoModalOpen} onOpenChange={setAvaliacaoModalOpen} empresaId={empresa.id} empresaNome={empresa.nome} />}
      
      {/* Modal de Autenticação */}
      <AuthDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen}
      />
    </div>;
};
export default EmpresaProfile;