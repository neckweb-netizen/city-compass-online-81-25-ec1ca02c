import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowUp, ArrowDown, MapPin, Calendar, Eye, User, MessageSquare } from 'lucide-react';
import { useProblemaDetalhes, useProblemasCidade } from '@/hooks/useProblemasCidade';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ComentariosList } from '@/components/problemas/ComentariosList';
import { ComentarioForm } from '@/components/problemas/ComentarioForm';
import { useAuth } from '@/hooks/useAuth';
import { AuthDialog } from '@/components/auth/AuthDialog';
import * as LucideIcons from 'lucide-react';

const ProblemaDetalhes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { problema, comentarios, isLoading, votarComentario } = useProblemaDetalhes(id!);
  const { votarProblema, incrementarVisualizacao } = useProblemasCidade();

  useEffect(() => {
    if (id) {
      incrementarVisualizacao.mutate(id);
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-4">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!problema) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Reclamação não encontrada</p>
      </div>
    );
  }

  const statusColors = {
    aberto: 'bg-red-500/10 text-red-500 border-red-500/20',
    em_analise: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    resolvido: 'bg-green-500/10 text-green-500 border-green-500/20',
    fechado: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };

  const prioridadeColors = {
    baixa: 'bg-blue-500/10 text-blue-500',
    media: 'bg-yellow-500/10 text-yellow-500',
    alta: 'bg-orange-500/10 text-orange-500',
    urgente: 'bg-red-500/10 text-red-500',
  };

  const statusLabels = {
    aberto: 'Aberto',
    em_analise: 'Em Análise',
    resolvido: 'Resolvido',
    fechado: 'Fechado',
  };

  const prioridadeLabels = {
    baixa: 'Baixa Prioridade',
    media: 'Prioridade Média',
    alta: 'Alta Prioridade',
    urgente: 'Urgente',
  };

  const handleVoto = async (tipoVoto: 1 | -1) => {
    if (!user) return;
    await votarProblema.mutateAsync({ problemaId: problema.id, tipoVoto });
  };

  const handleVotarComentario = async (comentarioId: string, tipoVoto: 1 | -1) => {
    if (!user) return;
    await votarComentario.mutateAsync({ comentarioId, tipoVoto });
  };

  const IconeCategoria = problema.categoria?.icone
    ? (LucideIcons as any)[problema.categoria.icone]
    : null;

  return (
    <div className="container mx-auto px-4 py-4 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-3"
          onClick={() => navigate('/reclamacoes')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="overflow-hidden shadow-lg border-border/50">
          <CardContent className="p-0">
            {/* Header com badges */}
            <div className="p-4 pb-3">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {problema.categoria && IconeCategoria && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm"
                    style={{
                      backgroundColor: `${problema.categoria.cor}20`,
                      color: problema.categoria.cor,
                    }}
                  >
                    <IconeCategoria className="w-4 h-4" />
                    {problema.categoria.nome}
                  </div>
                )}
                <Badge className={`${statusColors[problema.status]} border-0 shadow-sm`}>
                  {statusLabels[problema.status]}
                </Badge>
                <Badge className={`${prioridadeColors[problema.prioridade]} border-0 shadow-sm`}>
                  {prioridadeLabels[problema.prioridade]}
                </Badge>
              </div>

              {/* Título */}
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-3 leading-tight">
                {problema.titulo}
              </h1>

              {/* Metadados */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full">
                  <User className="w-3.5 h-3.5" />
                  <span className="font-medium">{problema.usuario?.nome || 'Anônimo'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{format(new Date(problema.criado_em), "d 'de' MMMM", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{problema.visualizacoes} visualizações</span>
                </div>
              </div>
            </div>

            {/* Localização */}
            <div className="mx-4 mb-3">
              <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                <div className="bg-primary/20 p-2 rounded-lg">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground mb-1 text-sm">
                    {problema.endereco}
                  </p>
                  {problema.bairro && (
                    <p className="text-xs text-muted-foreground">
                      {problema.bairro}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div className="px-4 mb-3">
              <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-sm">
                {problema.descricao}
              </p>
            </div>

            {/* Imagens */}
            {problema.imagens && problema.imagens.length > 0 && (
              <div className="px-4 mb-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {problema.imagens.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Imagem ${idx + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Votos */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-3 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVoto(1)}
                    disabled={!user}
                    className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary transition-colors"
                  >
                    <ArrowUp className="w-4 h-4" />
                    <span className="font-semibold">{problema.votos_positivos}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVoto(-1)}
                    disabled={!user}
                    className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-colors"
                  >
                    <ArrowDown className="w-4 h-4" />
                    <span className="font-semibold">{problema.votos_negativos}</span>
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-base font-bold ${
                    problema.votos_positivos - problema.votos_negativos > 0 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  }`}>
                    {problema.votos_positivos - problema.votos_negativos}
                  </div>
                  <span className="text-sm text-muted-foreground">pontos</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comentários - Layout responsivo */}
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
            <span>Comentários</span>
            <Badge variant="secondary" className="text-sm">
              {comentarios?.length || 0}
            </Badge>
          </h2>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Lista de comentários - 2/3 no desktop */}
            <div className="lg:col-span-2 space-y-3">
              {comentarios && comentarios.length > 0 ? (
                <ComentariosList 
                  comentarios={comentarios as any} 
                  onVotar={handleVotarComentario}
                  canVote={!!user}
                />
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-base font-medium mb-1">Nenhum comentário ainda</p>
                    <p className="text-sm">Seja o primeiro a comentar!</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Formulário de comentário - 1/3 no desktop, sticky */}
            {user && (
              <div className="lg:col-span-1">
                <ComentarioForm problemaId={problema.id} />
              </div>
            )}
          </div>

          {!user && (
            <Card className="mt-4 border-primary/20 bg-primary/5">
              <CardContent className="py-6 text-center">
                <p className="text-muted-foreground mb-4">
                  Faça login para comentar e interagir com a comunidade
                </p>
                <Button onClick={() => setAuthDialogOpen(true)}>
                  Entrar
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      </div>
  );
};

export default ProblemaDetalhes;
