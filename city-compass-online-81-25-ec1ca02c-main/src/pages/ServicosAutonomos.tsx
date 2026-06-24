
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Phone, Mail, MessageCircle, Eye, Search, Filter, User, ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ServicoContactInfo } from '@/components/servicos/ServicoContactInfo';
import { useCategoriasServicos } from '@/hooks/useCategorias';

interface Servico {
  id: string;
  nome_prestador: string;
  email_prestador?: string | null;
  telefone_prestador?: string | null;
  whatsapp_prestador?: string | null;
  descricao_servico: string;
  foto_perfil_url?: string | null;
  visualizacoes: number;
  criado_em: string;
  usuario_id?: string | null;
  categoria_nome?: string | null;
  status_aprovacao: string;
}

const ServicosAutonomos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');

  const { data: servicos = [], isLoading } = useQuery({
    queryKey: ['servicos-autonomos', searchTerm, selectedCategoria],
    queryFn: async () => {
      // Use secure function that conditionally returns contact info
      const { data, error } = await (supabase as any).rpc('get_servicos_with_secure_contact', {
        search_term: searchTerm || null,
        categoria_slug: selectedCategoria || null
      });
      
      if (error) throw error;
      return (data as Servico[]) || [];
    }
  });

  // Usar o hook específico para categorias de serviços
  const { data: categorias = [] } = useCategoriasServicos();

  const handleVisualizarServico = async (servicoId: string) => {
    await supabase.rpc('incrementar_visualizacao_servico', { servico_id: servicoId });
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold text-primary">
              Serviços Autônomos
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Conecte-se com profissionais qualificados e experientes na sua região
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300">
              <Link to="/oportunidades/anunciar-servico" className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                Anunciar Serviço
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/oportunidades" className="flex items-center">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Filter className="w-5 h-5 text-primary" />
              </div>
              Filtros de Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-12 border-2 focus:border-primary/50 transition-colors duration-300"
                />
              </div>
              
              <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                <SelectTrigger className="h-12 border-2 focus:border-primary/50 transition-colors duration-300">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.slug}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Serviços */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="grid gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="animate-pulse shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <div className="w-20 h-20 bg-muted/50 rounded-full"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-6 bg-muted/50 rounded w-1/3"></div>
                        <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                        <div className="h-4 bg-muted/50 rounded w-1/2"></div>
                        <div className="flex gap-2">
                          <div className="h-8 bg-muted/50 rounded w-24"></div>
                          <div className="h-8 bg-muted/50 rounded w-20"></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : servicos.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="py-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <Search className="w-16 h-16 text-muted-foreground/50" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">Nenhum serviço encontrado</h3>
                    <p className="text-muted-foreground">
                      Tente ajustar os filtros de busca para encontrar mais resultados.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {servicos.map((servico) => (
                <Card key={servico.id} className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-1">
                  <CardContent className="p-8">
                    <div className="flex flex-col lg:flex-row items-start gap-6">
                      <Avatar className="w-20 h-20 ring-4 ring-primary/10 group-hover:ring-primary/20 transition-all duration-300">
                        <AvatarImage src={servico.foto_perfil_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          <User className="w-10 h-10" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                              {servico.nome_prestador}
                            </h3>
                            {servico.categoria_nome && (
                              <Badge variant="secondary" className="text-sm px-3 py-1 bg-purple-100 text-purple-800">
                                {servico.categoria_nome}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                            <Eye className="w-4 h-4" />
                            {servico.visualizacoes} visualizações
                          </div>
                        </div>

                        <p className="text-muted-foreground text-lg leading-relaxed">
                          {servico.descricao_servico}
                        </p>

                        <ServicoContactInfo 
                          servico={servico}
                          onContact={handleVisualizarServico}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServicosAutonomos;
