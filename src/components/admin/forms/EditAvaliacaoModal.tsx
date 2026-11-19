import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useEditarAvaliacao } from '@/hooks/useAvaliacoes';

interface EditAvaliacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  avaliacao: {
    id: string;
    nota: number;
    comentario?: string;
    usuarios?: { nome: string };
    empresas?: { nome: string };
  };
}

export const EditAvaliacaoModal = ({ isOpen, onClose, avaliacao }: EditAvaliacaoModalProps) => {
  const [nota, setNota] = useState(avaliacao.nota);
  const [comentario, setComentario] = useState(avaliacao.comentario || '');
  const [hoveredStar, setHoveredStar] = useState(0);

  const { mutate: editarAvaliacao, isPending } = useEditarAvaliacao();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    editarAvaliacao({
      id: avaliacao.id,
      nota,
      comentario: comentario.trim() || undefined,
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starNumber = i + 1;
      const isActive = starNumber <= (hoveredStar || nota);
      
      return (
        <button
          key={i}
          type="button"
          aria-label={`Definir nota de ${starNumber} ${starNumber === 1 ? 'estrela' : 'estrelas'}`}
          aria-pressed={nota === starNumber}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => setNota(starNumber)}
          onMouseEnter={() => setHoveredStar(starNumber)}
          onMouseLeave={() => setHoveredStar(0)}
        >
          <Star aria-hidden="true" className={`h-6 w-6 transition-colors ${
            isActive ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`} />
        </button>
      );
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Avaliação</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="avaliacao-local">Local</Label>
            <Input id="avaliacao-local" value={avaliacao.empresas?.nome || 'N/A'} disabled />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="avaliacao-usuario">Usuário</Label>
            <Input id="avaliacao-usuario" value={avaliacao.usuarios?.nome || 'N/A'} disabled />
          </div>
          
          <div className="space-y-2">
            <Label>Nota</Label>
            <div role="group" aria-label="Selecionar nota da avaliação" className="flex flex-wrap gap-1">
              {renderStars()}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="comentario">Comentário</Label>
            <Textarea
              id="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Comentário da avaliação..."
              rows={4}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" className="min-h-11" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="min-h-11" aria-busy={isPending} disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};