import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, CheckCircle, XCircle, User, MessageSquare } from 'lucide-react';

export const ComentariosProblemaSection = () => {
  const [selectedComentario, setSelectedComentario] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: comentarios, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-comentarios-problema'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comentarios_problema')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;

      // Buscar informações de usuários e problemas manualmente
      const comentariosComDados = await Promise.all(
        (data || []).map(async (comentario) => {
          const [usuarioRes, problemaRes] = await Promise.all([
            supabase
              .from('usuarios')
              .select('nome')
              .eq('id', comentario.usuario_id)
              .maybeSingle(),
            supabase
              .from('problemas_cidade')
              .select('titulo')
              .eq('id', comentario.problema_id)
              .maybeSingle()
          ]);

          return {
            ...comentario,
            usuario: usuarioRes.data,
            problema: problemaRes.data,
          };
        })
      );

      return comentariosComDados;
    },
  });

  const moderarComentario = useMutation({
    mutationFn: async ({ comentarioId, ativo }: { comentarioId: string; ativo: boolean }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Sua sessão expirou. Faça login novamente.');

      const { data: updated, error } = await supabase
        .from('comentarios_problema')
        .update({
          ativo,
          moderado: true,
          moderado_por: user.id,
          data_moderacao: new Date().toISOString(),
        })
        .eq('id', comentarioId)
        .eq('moderado', false)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!updated) throw new Error('Comentário já moderado ou sem permissão.');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-comentarios-problema'] });
      void queryClient.invalidateQueries({ queryKey: ['comentarios-problema'] });
      toast.success('Comentário moderado com sucesso!');
      setSelectedComentario(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Erro ao moderar comentário');
    },
  });

  const handleModerar = (comentario: any) => {
    setSelectedComentario(comentario);
  };

  if (isLoading) return <div role="status" className="flex items-center justify-center p-8">Carregando...</div>;
  if (isError) return <div role="alert" className="space-y-3 p-6 text-center"><p>Não foi possível carregar a moderação de comentários.</p><Button variant="outline" onClick={() => { void refetch(); }}>Tentar novamente</Button></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Moderação de Comentários</h2>
        <p className="text-muted-foreground">
          Gerencie os comentários das reclamações
        </p>
      </div>

      <div className="grid gap-4">
        {comentarios?.map((comentario) => (
          <Card key={comentario.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">
                      {comentario.problema?.titulo || 'Problema deletado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-3.5 h-3.5" />
                    {comentario.usuario?.nome || 'Usuário deletado'}
                    <span>•</span>
                    <span>{format(new Date(comentario.criado_em), "d 'de' MMM 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {comentario.moderado ? (
                    <Badge variant={comentario.ativo ? 'default' : 'destructive'}>
                      {comentario.ativo ? 'Aprovado' : 'Rejeitado'}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Pendente</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground mb-4 whitespace-pre-wrap">
                {comentario.conteudo}
              </p>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <span>👍 {comentario.votos_positivos}</span>
                <span>•</span>
                <span>👎 {comentario.votos_negativos}</span>
              </div>

              {!comentario.moderado && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleModerar(comentario)} disabled={moderarComentario.isPending}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Moderar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {comentarios?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum comentário encontrado
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedComentario} onOpenChange={(open) => { if (!open && !moderarComentario.isPending) setSelectedComentario(null); }}>
        <DialogContent onEscapeKeyDown={(event) => { if (moderarComentario.isPending) event.preventDefault(); }} onInteractOutside={(event) => { if (moderarComentario.isPending) event.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle>Moderar Comentário</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Conteúdo:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {selectedComentario?.conteudo}
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                disabled={moderarComentario.isPending}
                onClick={() => moderarComentario.mutate({ 
                  comentarioId: selectedComentario?.id, 
                  ativo: false 
                })}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeitar
              </Button>
              <Button
                disabled={moderarComentario.isPending}
                onClick={() => moderarComentario.mutate({ 
                  comentarioId: selectedComentario?.id, 
                  ativo: true 
                })}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprovar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
