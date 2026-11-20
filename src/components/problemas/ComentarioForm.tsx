import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useProblemaDetalhes } from '@/hooks/useProblemasCidade';
import { useAuth } from '@/hooks/useAuth';
import { Send, User } from 'lucide-react';

interface ComentarioFormProps {
  problemaId: string;
}

export const ComentarioForm = ({ problemaId }: ComentarioFormProps) => {
  const [conteudo, setConteudo] = useState('');
  const submittingRef = useRef(false);
  const { criarComentario } = useProblemaDetalhes(problemaId);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || criarComentario.isPending) return;
    const message = conteudo.trim();
    if (message.length < 2 || message.length > 4000) { toast.error('O comentário deve ter de 2 a 4000 caracteres.'); return; }
    submittingRef.current = true;
    try {
      await criarComentario.mutateAsync({ conteudo: message });
      setConteudo('');
    } catch {
      // Preservar texto para nova tentativa.
    } finally {
      submittingRef.current = false;
    }
  };

  if (!user) return null;

  return (
    <Card className="sticky top-4 border-border/50 shadow-md">
      <CardContent className="p-3">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <Avatar className="h-9 w-9 bg-primary/10 shrink-0">
              <AvatarFallback className="text-primary font-semibold">
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Escreva seu comentário..."
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                maxLength={4000}
                disabled={criarComentario.isPending}
                rows={3}
                className="resize-none border-border/50 focus:border-primary transition-colors text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={conteudo.trim().length < 2 || criarComentario.isPending}
              className="gap-2 h-9"
              size="sm"
            >
              <Send className="w-3.5 h-3.5" />
              {criarComentario.isPending ? 'Enviando...' : 'Comentar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
