
import React from 'react';
import { EventoForm } from '@/components/admin/forms/EventoForm';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface EventoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
  onSuccess?: () => void;
}

export const EventoFormModal = ({ open, onOpenChange, empresaId, onSuccess }: EventoFormModalProps) => {
  const handleSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] flex flex-col p-4 sm:p-6">
        <div className="flex-1 overflow-y-auto pr-2">
          <EventoForm onSuccess={handleSuccess} empresaId={empresaId} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
