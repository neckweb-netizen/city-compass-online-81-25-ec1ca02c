
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Building2, User, Image, Plus } from 'lucide-react';
import { EventoForm } from '@/components/admin/forms/EventoForm';
import { useAuth } from '@/hooks/useAuth';

export const EventosSection = () => {
  const { profile } = useAuth();

  const { data: eventos, isLoading, refetch } = useQuery({
    queryKey: ['admin-eventos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select(`
          *,
          categorias(nome),
          empresas(nome),
          cidades(nome, estado)
        `)
        .order('data_inicio', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Eventos</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Eventos</h2>
          <p className="text-muted-foreground">
            Gerencie os eventos cadastrados no sistema
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline">
            {eventos?.length || 0} eventos cadastrados
          </Badge>
          <EventoForm onSuccess={refetch} />
        </div>
      </div>
      
      <div className="grid gap-4">
        {eventos?.map((evento) => (
          <Card key={evento.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {evento.titulo}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(evento.data_inicio).toLocaleDateString()}
                    </span>
                    {evento.empresas && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {evento.empresas.nome}
                      </span>
                    )}
                    {evento.local && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {evento.local}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge 
                    variant={
                      evento.status_aprovacao === 'aprovado' ? 'default' : 
                      evento.status_aprovacao === 'rejeitado' ? 'destructive' : 
                      'secondary'
                    }
                  >
                    {evento.status_aprovacao === 'aprovado' ? 'Aprovado' : 
                     evento.status_aprovacao === 'rejeitado' ? 'Rejeitado' : 
                     'Pendente'}
                  </Badge>
                  <Badge variant={evento.ativo ? 'default' : 'secondary'}>
                    {evento.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                  {evento.categorias && (
                    <Badge variant="outline">
                      {evento.categorias.nome}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {evento.descricao && (
                  <p className="text-sm text-muted-foreground">
                    {evento.descricao}
                  </p>
                )}
                
                <div className="grid gap-2 text-sm">
                  {evento.data_fim && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Data fim:</span>
                      <span>{new Date(evento.data_fim).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {evento.endereco && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Endereço:</span>
                      <span>{evento.endereco}</span>
                    </div>
                  )}

                  {evento.cidades && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Cidade:</span>
                      <span>{evento.cidades.nome} - {evento.cidades.estado}</span>
                    </div>
                  )}
                  
                  {evento.imagem_banner ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <Image className="w-4 h-4" />
                      <span>Banner configurado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Image className="w-4 h-4" />
                      <span>Sem banner</span>
                    </div>
                  )}

                  {evento.status_aprovacao === 'pendente' && profile?.tipo_conta && ['admin_geral', 'admin_cidade'].includes(profile.tipo_conta) && (
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        onClick={async () => {
                          const { error } = await supabase
                            .from('eventos')
                            .update({ 
                              status_aprovacao: 'aprovado',
                              aprovado_por: profile.id,
                              data_aprovacao: new Date().toISOString(),
                              ativo: true
                            })
                            .eq('id', evento.id);
                          
                          if (!error) refetch();
                        }}
                      >
                        Aprovar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={async () => {
                          const { error } = await supabase
                            .from('eventos')
                            .update({ 
                              status_aprovacao: 'rejeitado',
                              aprovado_por: profile.id,
                              data_aprovacao: new Date().toISOString(),
                              ativo: false
                            })
                            .eq('id', evento.id);
                          
                          if (!error) refetch();
                        }}
                      >
                        Rejeitar
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t text-xs text-muted-foreground">
                  <p>Criado em: {new Date(evento.criado_em).toLocaleDateString()}</p>
                  <p>Atualizado em: {new Date(evento.atualizado_em).toLocaleDateString()}</p>
                  {evento.data_aprovacao && (
                    <p>Aprovado em: {new Date(evento.data_aprovacao).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )) || []}
        
        {(!eventos || eventos.length === 0) && (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum evento cadastrado ainda.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
