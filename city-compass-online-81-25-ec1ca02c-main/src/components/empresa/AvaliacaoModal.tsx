
import { useState } from 'react';
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
  const [nota, setNota] = useState<number>(0);
  const [comentario, setComentario] = useState('');
  const [hoveredStar, setHoveredStar] = useState<number>(0);

  const criarAvaliacaoMutation = useCriarAvaliacao();

  const handleSubmit = () => {
    if (!user) {
      return;
    }
    
    if (nota === 0) {
      return;
    }

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
      }
    });
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starNumber = i + 1;
      const isSelected = starNumber <= nota;
      const isHovered = hoveredStar > 0 && starNumber <= hoveredStar;
      
      return (
        <Star
          key={i}
          className={`h-8 w-8 cursor-pointer transition-colors ${
            isSelected || isHovered
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-gray-300 hover:text-yellow-200'
          }`}
          onClick={() => setNota(starNumber)}
          onMouseEnter={() => setHoveredStar(starNumber)}
          onMouseLeave={() => setHoveredStar(0)}
        />
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <label className="text-sm font-medium">
              Comentário (opcional)
            </label>
            <Textarea
              placeholder="Conte sua experiência com esta empresa..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={criarAvaliacaoMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={nota === 0 || criarAvaliacaoMutation.isPending}
              className="flex-1"
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
