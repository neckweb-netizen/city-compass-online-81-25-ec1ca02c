
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Building2, Plus, Users, Filter } from 'lucide-react';
import { EventoForm } from '@/components/admin/forms/EventoForm';
import { useAuth } from '@/hooks/useAuth';
import { useCidadePadrao } from '@/hooks/useCidadePadrao';

export const EventosContent = () => {
  const { user } = useAuth();
  const { data: cidadePadrao } = useCidadePadrao();
  const navigate = useNavigate();

  const { data: eventos, isLoading, refetch } = useQuery({
    queryKey: ['eventos-publicos', cidadePadrao?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select(`
          *,
          categorias(nome),
          empresas(nome),
          cidades(nome, estado)
        `)
        .eq('ativo', true)
        .eq('status_aprovacao', 'aprovado')
        .eq('cidade_id', cidadePadrao?.id)
        .gte('data_inicio', new Date().toISOString())
        .order('data_inicio', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!cidadePadrao?.id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-8 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Eventos em {cidadePadrao?.nome}
            </h1>
            <p className="text-muted-foreground text-lg">
              Descubra os melhores eventos e atividades da sua cidade
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{eventos?.length || 0} eventos</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>Atualizado hoje</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {user && <EventoForm onSuccess={refetch} />}
          </div>
        </div>
      </div>

      {/* Grid de Eventos */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {eventos?.map((evento) => (
          <Card 
            key={evento.id} 
            className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => navigate(`/evento/${evento.id}`)}
          >
            {evento.imagem_banner && (
              <div className="aspect-video overflow-hidden">
                <img
                  src={evento.imagem_banner}
                  alt={evento.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            
            <CardHeader className="pb-3">
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {evento.categorias && (
                    <Badge variant="secondary" className="text-xs">
                      {evento.categorias.nome}
                    </Badge>
                  )}
                  {evento.cidades && (
                    <Badge variant="outline" className="text-xs">
                      {evento.cidades.nome}
                    </Badge>
                  )}
                </div>
                <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                  {evento.titulo}
                </CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {evento.descricao && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {evento.descricao}
                </p>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium">
                    {new Date(evento.data_inicio).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(evento.data_inicio).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                {evento.local && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="line-clamp-1">{evento.local}</span>
                  </div>
                )}
                
                {evento.empresas && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="line-clamp-1">{evento.empresas.nome}</span>
                  </div>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/evento/${evento.id}`);
                }}
              >
                Ver Detalhes
              </Button>
            </CardContent>
          </Card>
        )) || []}
        
        {(!eventos || eventos.length === 0) && (
          <div className="col-span-full">
            <Card className="border-dashed">
              <CardContent className="text-center py-16">
                <div className="space-y-4">
                  <Calendar className="w-16 h-16 text-muted-foreground/50 mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Nenhum evento encontrado</h3>
                    <p className="text-muted-foreground">
                      Não há eventos programados para {cidadePadrao?.nome} no momento.
                    </p>
                  </div>
                  {user && (
                    <div className="pt-4">
                      <EventoForm onSuccess={refetch} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
