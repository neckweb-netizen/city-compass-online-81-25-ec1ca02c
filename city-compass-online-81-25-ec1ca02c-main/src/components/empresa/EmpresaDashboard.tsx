
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NeonCard } from '@/components/ui/neon-card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, Phone, Globe, Mail, Settings, Star, Calendar, Package, ChevronDown, CreditCard, Briefcase, CalendarCheck } from 'lucide-react';
import { useMinhaEmpresa } from '@/hooks/useMinhaEmpresa';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EmpresaEditForm } from './EmpresaEditForm';
import { EmpresaProdutos } from './EmpresaProdutos';
import { EmpresaEventos } from './EmpresaEventos';
import { EmpresaCupons } from './EmpresaCupons';
import { EmpresaVagas } from './EmpresaVagas';
import { MuralAvisos } from './MuralAvisos';
import { EmpresaActions } from './EmpresaActions';
import { HorarioFuncionamentoForm } from './HorarioFuncionamentoForm';
import { InfluencerDashboard } from './InfluencerDashboard';
import { PlanosDisponiveis } from './PlanosDisponiveis';
import { EnderecosList } from './EnderecosList';
import { AvisoPlanoExpirado } from './AvisoPlanoExpirado';
import { AgendamentosEmpresa } from './AgendamentosEmpresa';
import { ConfiguracaoAgendamentos } from './ConfiguracaoAgendamentos';

export const EmpresaDashboard = () => {
  const { user, profile } = useAuth();
  const { empresa, empresas, isLoading } = useMinhaEmpresa();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('');
  const [configuracoesAgendamentoAbertas, setConfiguracoesAgendamentoAbertas] = useState(false);

  // Define aba inicial baseada no state da navegação
  useEffect(() => {
    const state = location.state as { activeTab?: string };
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
    }
  }, [location.state]);

  // Determina qual empresa exibir (selecionada ou primeira disponível)
  const empresaAtual = selectedEmpresaId 
    ? empresas.find(emp => emp.id === selectedEmpresaId) || empresa
    : empresa;

  // Buscar categoria da empresa
  const { data: categoria } = useQuery({
    queryKey: ['categoria', empresaAtual?.categoria_id],
    queryFn: async () => {
      if (!empresaAtual?.categoria_id) return null;
      const { data, error } = await supabase
        .from('categorias')
        .select('nome')
        .eq('id', empresaAtual.categoria_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!empresaAtual?.categoria_id,
  });

  // Verifica se é uma empresa de serviços que permite agendamento
  const categoriasComAgendamento = ['Serviços', 'Manicure e Pedicure', 'Beleza', 'Saúde', 'Estética'];
  const permiteAgendamento = categoria?.nome && categoriasComAgendamento.includes(categoria.nome);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Carregando painel da empresa...</p>
        </div>
      </div>
    );
  }

  if (!empresaAtual) {
    return (
      <div className="container mx-auto px-4 py-8">
        <NeonCard>
          <CardContent className="text-center py-12">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Empresa não encontrada</h2>
            <p className="text-muted-foreground mb-6">
              Você precisa ter uma empresa cadastrada para acessar este painel.
            </p>
          </CardContent>
        </NeonCard>
      </div>
    );
  }

  // Se for um influencer, mostrar dashboard específico
  if (empresaAtual.categoria_id === 'categoria-influencers') {
    return <InfluencerDashboard />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Aviso de Plano Expirado */}
      <AvisoPlanoExpirado />
      
      {/* Mural de Avisos no Topo */}
      <div className="mb-8">
        <MuralAvisos />
      </div>

      {/* Seletor de Empresas (se houver múltiplas) */}
      {empresas.length > 1 && (
        <div className="mb-6">
          <NeonCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Selecionar Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedEmpresaId || empresa?.id || ''} 
                onValueChange={setSelectedEmpresaId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>{emp.nome}</span>
                        {emp.verificado && (
                          <Badge variant="secondary" className="text-xs">
                            Verificado
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </NeonCard>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {empresaAtual.imagem_capa_url && (
              <img
                src={empresaAtual.imagem_capa_url}
                alt={empresaAtual.nome}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                {empresaAtual.nome}
                {empresaAtual.verificado && (
                  <Badge variant="default" className="bg-blue-600">
                    <Star className="w-3 h-3 mr-1" />
                    Verificado
                  </Badge>
                )}
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground mt-1">
                {empresaAtual.endereco && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {empresaAtual.endereco}
                  </span>
                )}
                {empresaAtual.telefone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {empresaAtual.telefone}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Badge 
              variant={
                empresaAtual.status_aprovacao === 'aprovado' ? 'default' : 
                empresaAtual.status_aprovacao === 'rejeitado' ? 'destructive' : 
                'secondary'
              }
            >
              Status: {empresaAtual.status_aprovacao === 'aprovado' ? 'Aprovado' : 
                      empresaAtual.status_aprovacao === 'rejeitado' ? 'Rejeitado' : 
                      'Pendente'}
            </Badge>
            <Badge variant={empresaAtual.ativo ? 'default' : 'secondary'}>
              {empresaAtual.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>
        
        <EmpresaActions empresa={empresaAtual} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid ${permiteAgendamento ? 'grid-cols-4 grid-rows-3' : 'grid-cols-4 grid-rows-2'} w-full gap-2 p-3 bg-red-600 h-auto`}>
          <TabsTrigger 
            value="overview" 
            className="flex flex-col items-center gap-1 text-xs py-2 px-2 text-white border-0 bg-transparent data-[state=active]:bg-white data-[state=active]:text-red-600 hover:bg-red-500 rounded-md h-auto"
          >
            <Building2 className="w-4 h-4" />
            <span className="text-center leading-tight">Visão</span>
          </TabsTrigger>
          <TabsTrigger 
            value="enderecos" 
            className="flex flex-col items-center gap-1 text-xs py-2 px-2 text-white border-0 bg-transparent data-[state=active]:bg-white data-[state=active]:text-red-600 hover:bg-red-500 rounded-md h-auto"
          >
            <MapPin className="w-4 h-4" />
            <span className="text-center leading-tight">Endereços</span>
          </TabsTrigger>
          <TabsTrigger 
            value="produtos" 
            className="flex flex-col items-center gap-1 text-xs py-2 px-2 text-white border-0 bg-transparent data-[state=active]:bg-white data-[state=active]:text-red-600 hover:bg-red-500 rounded-md h-auto"
          >
            <Package className="w-4 h-4" />
            <span className="text-center leading-tight">Produtos</span>
          </TabsTrigger>
          <TabsTrigger 
            value="eventos" 
            className="flex flex-col items-center gap-1 text-xs py-2 px-2 text-white border-0 bg-transparent data-[state=active]:bg-white data-[state=active]:text-red-600 hover:bg-red-500 rounded-md h-auto"
          >
            <Calendar className="w-4 h-4" />
            <span className="text-center leading-tight">Eventos</span>
          </TabsTrigger>
          <TabsTrigger 
            value="cupons" 
            className="flex flex-col items-center gap-1 text-xs py-2 px-2 text-white border-0 bg-transparent data-[state=active]:bg-white data-[state=active]:text-red-600 hover:bg-red-500 rounded-md h-auto"
          >
            <Package className="w-4 h-4" />
            <span className="text-center leading-tight">Cupons</span>
          </TabsTrigger>
          <TabsTrigger 
            value="vagas" 
            className="flex flex-col items-center gap-1 text-xs py-2 px-2 text-white border-0 bg-transparent data-[state=active]:bg-white data-[state=active]:text-red-600 hover:bg-red-500 rounded-md h-auto"
          >
            <Briefcase className="w-4 h-4" />
            <span className="text-center leading-tight">Vagas</span>
          </TabsTrigger>
          <TabsTrigger 
            value="planos" 
            className="flex flex-col items-center gap-1 text-xs py-2 px-2 text-white border-0 bg-transparent data-[state=active]:bg-white data-[state=active]:text-red-600 hover:bg-red-500 rounded-md h-auto"
          >
            <CreditCard className="w-4 h-4" />
            <span className="text-center leading-tight">Planos</span>
          </TabsTrigger>
          <TabsTrigger 
            value="configuracoes" 
            className="flex flex-col items-center gap-1 text-xs py-2 px-2 text-white border-0 bg-transparent data-[state=active]:bg-white data-[state=active]:text-red-600 hover:bg-red-500 rounded-md h-auto"
          >
            <Settings className="w-4 h-4" />
            <span className="text-center leading-tight">Config</span>
          </TabsTrigger>
          {permiteAgendamento && (
            <TabsTrigger 
              value="agendamentos" 
              className="flex flex-col items-center gap-1 text-xs py-2 px-2 text-white border-0 bg-transparent data-[state=active]:bg-white data-[state=active]:text-red-600 hover:bg-red-500 rounded-md h-auto"
            >
              <CalendarCheck className="w-4 h-4" />
              <span className="text-center leading-tight">Agendamentos</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <NeonCard>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
              </CardHeader>
               <CardContent className="space-y-4">
                {empresaAtual.descricao && (
                  <div>
                    <h4 className="font-medium mb-2">Descrição</h4>
                    <p className="text-sm text-muted-foreground">{empresaAtual.descricao}</p>
                  </div>
                )}
                
                <div className="grid gap-2">
                  {empresaAtual.site && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a 
                        href={empresaAtual.site} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {empresaAtual.site}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </NeonCard>

            <NeonCard>
              <CardHeader>
                <CardTitle>Status da Empresa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Status de Aprovação:</span>
                    <Badge 
                      variant={
                        empresaAtual.status_aprovacao === 'aprovado' ? 'default' : 
                        empresaAtual.status_aprovacao === 'rejeitado' ? 'destructive' : 
                        'secondary'
                      }
                    >
                      {empresaAtual.status_aprovacao === 'aprovado' ? 'Aprovado' : 
                       empresaAtual.status_aprovacao === 'rejeitado' ? 'Rejeitado' : 
                       'Pendente'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Empresa Ativa:</span>
                    <Badge variant={empresaAtual.ativo ? 'default' : 'secondary'}>
                      {empresaAtual.ativo ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Verificado:</span>
                    <Badge variant={empresaAtual.verificado ? 'default' : 'secondary'}>
                      {empresaAtual.verificado ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Em Destaque:</span>
                    <Badge variant={empresaAtual.destaque ? 'default' : 'secondary'}>
                      {empresaAtual.destaque ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Criado em: {new Date(empresaAtual.criado_em).toLocaleDateString('pt-BR')}</p>
                  <p>Atualizado em: {new Date(empresaAtual.atualizado_em).toLocaleDateString('pt-BR')}</p>
                  {empresaAtual.data_aprovacao && (
                    <p>Aprovado em: {new Date(empresaAtual.data_aprovacao).toLocaleDateString('pt-BR')}</p>
                  )}
                </div>
              </CardContent>
            </NeonCard>
          </div>
        </TabsContent>

        <TabsContent value="enderecos" className="mt-6">
          <EnderecosList empresaId={empresaAtual.id} canEdit={true} />
        </TabsContent>

        <TabsContent value="produtos" className="mt-6">
          <EmpresaProdutos empresaId={empresaAtual.id} />
        </TabsContent>

        <TabsContent value="eventos" className="mt-6">
          <EmpresaEventos />
        </TabsContent>

        <TabsContent value="cupons" className="mt-6">
          <EmpresaCupons empresaId={empresaAtual.id} isOwner={true} />
        </TabsContent>

        <TabsContent value="vagas" className="mt-6">
          <EmpresaVagas empresaId={empresaAtual.id} />
        </TabsContent>

        <TabsContent value="planos" className="mt-6">
          <PlanosDisponiveis empresaId={empresaAtual.id} />
        </TabsContent>

        <TabsContent value="configuracoes" className="mt-6">
          <div className="space-y-6">
            <NeonCard>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configurações da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <p className="text-muted-foreground mb-4">
                      Gerencie as informações da sua empresa, atualize dados de contato e configure preferências.
                    </p>
                    
                    <Button
                      onClick={() => setEditFormOpen(true)}
                      className="w-full sm:w-auto"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Editar Informações da Empresa
                    </Button>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">Informações Básicas</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>• Nome da empresa</p>
                        <p>• Categoria e descrição</p>
                        <p>• Endereço e telefone</p>
                        <p>• Site da empresa</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Mídia e Imagens</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>• Imagem de capa</p>
                        <p>• Galeria de fotos</p>
                        <p>• Logotipo da empresa</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </NeonCard>
            
            {/* Horário de Funcionamento */}
            <HorarioFuncionamentoForm />

          </div>
        </TabsContent>

        {permiteAgendamento && (
          <TabsContent value="agendamentos" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <CalendarCheck className="w-6 h-6" />
                  Agendamentos
                </h2>
                <Button 
                  variant="outline" 
                  onClick={() => setConfiguracoesAgendamentoAbertas(!configuracoesAgendamentoAbertas)}
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  {configuracoesAgendamentoAbertas ? 'Ocultar Configurações' : 'Configurações'}
                </Button>
              </div>
              
              {configuracoesAgendamentoAbertas && (
                <ConfiguracaoAgendamentos empresaId={empresaAtual.id} />
              )}
              
              <AgendamentosEmpresa empresaId={empresaAtual.id} />
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Modal de Edição */}
      <EmpresaEditForm 
        empresa={empresaAtual} 
        open={editFormOpen} 
        onOpenChange={setEditFormOpen} 
      />
    </div>
  );
};
