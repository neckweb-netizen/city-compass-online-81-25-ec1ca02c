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
        <Star
          key={i}
          className={`w-6 h-6 cursor-pointer transition-colors ${
            isActive ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
          onClick={() => setNota(starNumber)}
          onMouseEnter={() => setHoveredStar(starNumber)}
          onMouseLeave={() => setHoveredStar(0)}
        />
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
            <Label>Local</Label>
            <Input value={avaliacao.empresas?.nome || 'N/A'} disabled />
          </div>
          
          <div className="space-y-2">
            <Label>Usuário</Label>
            <Input value={avaliacao.usuarios?.nome || 'N/A'} disabled />
          </div>
          
          <div className="space-y-2">
            <Label>Nota</Label>
            <div className="flex gap-1">
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};