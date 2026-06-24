
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Clock, DollarSign, Eye, Search, Filter, ArrowLeft, Briefcase, Building, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Dialog } from '@/components/ui/dialog';
import { VagaFormModal } from '@/components/forms/VagaFormModal';

interface Vaga {
  id: string;
  titulo: string;
  descricao: string;
  tipo_vaga: string;
  faixa_salarial: string | null;
  forma_candidatura: string;
  contato_candidatura: string;
  visualizacoes: number;
  criado_em: string;
  categorias_oportunidades: {
    nome: string;
  } | null;
}

const VagasEmprego = () => {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('todos');
  const [selectedTipo, setSelectedTipo] = useState<'todos' | 'clt' | 'temporario' | 'estagio' | 'freelance'>('todos');
  const [isVagaModalOpen, setIsVagaModalOpen] = useState(false);
  
  const isEmpresa = profile?.tipo_conta === 'empresa';

  const { data: vagas = [], isLoading } = useQuery({
    queryKey: ['vagas-emprego', searchTerm, selectedCategoria, selectedTipo],
    queryFn: async () => {
      let query = supabase
        .from('vagas_emprego')
        .select(`
          *,
          categorias_oportunidades!inner(nome)
        `)
        .eq('ativo', true)
        .order('criado_em', { ascending: false });

      if (searchTerm) {
        query = query.ilike('titulo', `%${searchTerm}%`);
      }

      if (selectedCategoria !== 'todos') {
        query = query.eq('categorias_oportunidades.slug', selectedCategoria);
      }

      if (selectedTipo !== 'todos') {
        query = query.eq('tipo_vaga', selectedTipo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Vaga[];
    }
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias-vagas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_oportunidades')
        .select('*')
        .eq('tipo', 'vaga')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });


  const handleVisualizarVaga = async (vagaId: string) => {
    await supabase.rpc('incrementar_visualizacao_vaga', { vaga_id: vagaId });
  };

  const getTipoVagaLabel = (tipo: string) => {
    const labels = {
      'clt': 'CLT',
      'temporario': 'Temporário',
      'estagio': 'Estágio',
      'freelance': 'Freelance'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  const getTipoVagaColor = (tipo: string) => {
    const colors = {
      'clt': 'bg-green-100 text-green-800',
      'temporario': 'bg-blue-100 text-blue-800',
      'estagio': 'bg-yellow-100 text-yellow-800',
      'freelance': 'bg-purple-100 text-purple-800'
    };
    return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold text-primary">
              Vagas de Emprego
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Descubra oportunidades de carreira na sua região
            </p>
          </div>
          <Button asChild variant="outline" size="lg">
            <Link to="/oportunidades" className="flex items-center">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        {/* Filtros */}
        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Filter className="w-5 h-5 text-primary" />
              </div>
              Filtros de Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar vagas por título..."
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
                  <SelectItem value="todos">Todas as categorias</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.slug}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTipo} onValueChange={(value) => setSelectedTipo(value as 'todos' | 'clt' | 'temporario' | 'estagio' | 'freelance')}>
                <SelectTrigger className="h-12 border-2 focus:border-primary/50 transition-colors duration-300">
                  <SelectValue placeholder="Tipo de contrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="clt">CLT</SelectItem>
                  <SelectItem value="temporario">Temporário</SelectItem>
                  <SelectItem value="estagio">Estágio</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Vagas */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="grid gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="animate-pulse shadow-lg">
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="h-6 bg-muted/50 rounded w-2/3"></div>
                          <div className="h-4 bg-muted/50 rounded w-1/4"></div>
                        </div>
                        <div className="h-6 bg-muted/50 rounded w-16"></div>
                      </div>
                      <div className="h-4 bg-muted/50 rounded w-full"></div>
                      <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                      <div className="flex gap-2">
                        <div className="h-8 bg-muted/50 rounded w-24"></div>
                        <div className="h-8 bg-muted/50 rounded w-20"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : vagas.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="py-16 text-center">
                <div className="flex flex-col items-center gap-4">
                  <Briefcase className="w-16 h-16 text-muted-foreground/50" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">Nenhuma vaga encontrada</h3>
                    <p className="text-muted-foreground">
                      Tente ajustar os filtros de busca para encontrar mais oportunidades.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {vagas.map((vaga) => (
                <Card key={vaga.id} className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-1">
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                            {vaga.titulo}
                          </h3>
                          <p className="text-muted-foreground text-lg leading-relaxed line-clamp-3">
                            {vaga.descricao}
                          </p>
                        </div>
                        <Badge className={`text-sm px-4 py-2 font-medium ${getTipoVagaColor(vaga.tipo_vaga)}`}>
                          {getTipoVagaLabel(vaga.tipo_vaga)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {vaga.categorias_oportunidades && (
                          <div className="flex items-center gap-2">
                            <Building className="w-5 h-5 text-primary flex-shrink-0" />
                            <span className="font-medium text-sm">{vaga.categorias_oportunidades.nome}</span>
                          </div>
                        )}
                        
                        {vaga.faixa_salarial && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <DollarSign className="w-5 h-5 text-primary flex-shrink-0" />
                            <span className="text-sm font-medium">{vaga.faixa_salarial}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            {vaga.visualizacoes} visualizações
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {new Date(vaga.criado_em).toLocaleDateString()}
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleVisualizarVaga(vaga.id)}
                          size="lg"
                          className="shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          Ver Detalhes
                        </Button>
                      </div>

                      <div className="bg-muted/30 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">Como se candidatar:</span> {vaga.forma_candidatura}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Botão Flutuante para Empresas */}
      {isEmpresa && (
        <>
          <Button
            onClick={() => setIsVagaModalOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl z-50 flex items-center justify-center"
            title="Publicar nova vaga"
          >
            <Plus className="w-6 h-6" />
          </Button>
          
          <VagaFormModal 
            open={isVagaModalOpen} 
            onOpenChange={setIsVagaModalOpen}
          />
        </>
      )}
    </div>
  );
};

export default VagasEmprego;
