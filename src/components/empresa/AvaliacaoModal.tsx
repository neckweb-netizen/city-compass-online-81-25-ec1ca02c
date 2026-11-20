
import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCriarAvaliacao } from '@/hooks/useAvaliacoes';

interface AvaliacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
  empresaNome: string;
}

export const AvaliacaoModal = ({ open, onOpenChange, empresaId, empresaNome }: AvaliacaoModalProps) => {
  const { user } = useAuth();
  const submittingRef = useRef(false);
  const [nota, setNota] = useState<number>(0);
  const [comentario, setComentario] = useState('');
  const [hoveredStar, setHoveredStar] = useState<number>(0);

  const criarAvaliacaoMutation = useCriarAvaliacao();

  const handleSubmit = () => {
    if (!user) {
      return;
    }
    
    if (nota === 0 || comentario.length > 4000 || submittingRef.current || criarAvaliacaoMutation.isPending) return;
    submittingRef.current = true;
    criarAvaliacaoMutation.mutate({
      empresaId,
      nota,
      comentario,
      usuarioId: user.id,
    }, {
      onSuccess: () => {
        setNota(0);
        setComentario('');
        onOpenChange(false);
      },
      onSettled: () => { submittingRef.current = false; }
    });
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starNumber = i + 1;
      const isSelected = starNumber <= nota;
      const isHovered = hoveredStar > 0 && starNumber <= hoveredStar;
      
      return (
        <button
          key={i}
          type="button"
          aria-label={`Avaliar com ${starNumber} ${starNumber === 1 ? 'estrela' : 'estrelas'}`}
          aria-pressed={nota === starNumber}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => setNota(starNumber)}
          onMouseEnter={() => setHoveredStar(starNumber)}
          onMouseLeave={() => setHoveredStar(0)}
        >
          <Star
            aria-hidden="true"
            className={`h-8 w-8 transition-colors ${
              isSelected || isHovered
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-200'
            }`}
          />
        </button>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && submittingRef.current) return; onOpenChange(nextOpen); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar {empresaNome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rating */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Como você avalia esta empresa?</p>
            <div className="flex justify-center space-x-1">
              {renderStars()}
            </div>
            {nota > 0 && (
              <p className="text-sm font-medium">
                {nota === 1 && 'Muito ruim'}
                {nota === 2 && 'Ruim'}
                {nota === 3 && 'Regular'}
                {nota === 4 && 'Bom'}
                {nota === 5 && 'Excelente'}
              </p>
            )}
          </div>

          {/* Comentário */}
          <div className="space-y-2">
            <label htmlFor="avaliacao-comentario" className="text-sm font-medium">
              Comentário (opcional)
            </label>
            <Textarea
              id="avaliacao-comentario"
              placeholder="Conte sua experiência com esta empresa..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={4}
              maxLength={4000}
              className="resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              className="min-h-11 flex-1"
              disabled={criarAvaliacaoMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              aria-busy={criarAvaliacaoMutation.isPending}
              disabled={nota === 0 || criarAvaliacaoMutation.isPending}
              className="min-h-11 flex-1"
            >
              {criarAvaliacaoMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
