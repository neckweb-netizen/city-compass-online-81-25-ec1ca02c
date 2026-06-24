
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Banner } from '@/hooks/useAdminBanners';

interface DuplicateBannerModalProps {
  banner: Banner | null;
  isOpen: boolean;
  onClose: () => void;
  onDuplicate: (bannerId: string, newSecao: Banner['secao']) => void;
  isLoading?: boolean;
}

const secaoOptions = [
  { value: 'home', label: 'Página Inicial' },
  { value: 'locais', label: 'Locais' },
  { value: 'eventos', label: 'Eventos' },
  { value: 'categorias', label: 'Categorias' },
  { value: 'busca', label: 'Busca' },
];

export const DuplicateBannerModal = ({
  banner,
  isOpen,
  onClose,
  onDuplicate,
  isLoading = false
}: DuplicateBannerModalProps) => {
  const [selectedSecao, setSelectedSecao] = useState<Banner['secao'] | ''>('');

  const handleDuplicate = () => {
    if (banner && selectedSecao) {
      onDuplicate(banner.id, selectedSecao as Banner['secao']);
      setSelectedSecao('');
    }
  };

  const handleClose = () => {
    setSelectedSecao('');
    onClose();
  };

  const availableSections = secaoOptions.filter(option => 
    option.value !== banner?.secao
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Duplicar Banner</DialogTitle>
          <DialogDescription>
            Selecione a seção onde deseja duplicar o banner "{banner?.titulo}".
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="secao-destino">Seção de destino *</Label>
            <Select value={selectedSecao} onValueChange={(value) => setSelectedSecao(value as Banner['secao'] | '')}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a seção" />
              </SelectTrigger>
              <SelectContent>
                {availableSections.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {banner && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Banner original:</strong> {banner.titulo}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Seção atual:</strong> {secaoOptions.find(s => s.value === banner.secao)?.label}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDuplicate}
            disabled={isLoading || !selectedSecao}
          >
            {isLoading ? 'Duplicando...' : 'Duplicar Banner'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
