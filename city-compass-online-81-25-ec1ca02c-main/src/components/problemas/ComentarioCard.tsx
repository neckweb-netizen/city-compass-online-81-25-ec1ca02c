import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowUp, ArrowDown, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Comentario {
  id: string;
  conteudo: string;
  votos_positivos: number;
  votos_negativos: number;
  criado_em: string;
  usuario?: {
    nome: string;
  };
}

interface ComentarioCardProps {
  comentario: Comentario;
  onVotar?: (comentarioId: string, tipoVoto: 1 | -1) => void;
  canVote?: boolean;
}

export const ComentarioCard = ({ comentario, onVotar, canVote = false }: ComentarioCardProps) => {
  const totalVotos = comentario.votos_positivos - comentario.votos_negativos;
  const nomeUsuario = comentario.usuario?.nome || 'Anônimo';
  const iniciaisUsuario = nomeUsuario.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <Card className="border-border/50 hover:border-border transition-colors duration-200">
      <CardContent className="p-3">
        <div className="flex gap-2">
          {/* Coluna de votação */}
          <div className="flex flex-col items-center gap-1 min-w-[36px]">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors ${
                canVote ? '' : 'cursor-not-allowed opacity-50'
              }`}
              onClick={() => onVotar?.(comentario.id, 1)}
              disabled={!canVote}
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </Button>
            <span className={`text-sm font-semibold ${
              totalVotos > 0 ? 'text-primary' : totalVotos < 0 ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              {totalVotos}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors ${
                canVote ? '' : 'cursor-not-allowed opacity-50'
              }`}
              onClick={() => onVotar?.(comentario.id, -1)}
              disabled={!canVote}
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Conteúdo do comentário */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-7 w-7 bg-primary/10">
                <AvatarFallback className="text-primary font-semibold text-xs">
                  {iniciaisUsuario}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {nomeUsuario}
                </span>
                <span className="hidden sm:inline text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(comentario.criado_em), "d 'de' MMM 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
              {comentario.conteudo}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
