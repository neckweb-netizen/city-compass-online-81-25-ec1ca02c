import { useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export interface EventoEditavel {
  id: string;
  titulo: string;
  descricao: string | null;
  local: string | null;
  endereco: string | null;
  data_inicio: string;
  data_fim: string | null;
}

interface EventoEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId: string;
  evento: EventoEditavel;
  onSaved: () => void;
}

const toLocalDatetime = (value: string | null): string => {
  if (!value) return '';
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return '';
  return new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000)
    .toISOString().slice(0, 16);
};

export const EventoEditModal = ({ open, onOpenChange, empresaId, evento, onSaved }: EventoEditModalProps) => {
  const [titulo, setTitulo] = useState(evento.titulo);
  const [descricao, setDescricao] = useState(evento.descricao || '');
  const [local, setLocal] = useState(evento.local || '');
  const [endereco, setEndereco] = useState(evento.endereco || '');
  const [inicio, setInicio] = useState(toLocalDatetime(evento.data_inicio));
  const [fim, setFim] = useState(toLocalDatetime(evento.data_fim));
  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;
    const startsAt = new Date(inicio);
    const endsAt = fim ? new Date(fim) : null;
    if (titulo.trim().length < 3 || !Number.isFinite(startsAt.getTime()) ||
        (endsAt && (!Number.isFinite(endsAt.getTime()) || endsAt <= startsAt))) {
      toast.error('Informe título válido e horário de término posterior ao início.');
      return;
    }

    submittingRef.current = true;
    setSaving(true);
    try {
      const { data: updated, error } = await supabase
        .from('eventos')
        .update({
          titulo: titulo.trim(),
          descricao: descricao.trim() || null,
          local: local.trim() || null,
          endereco: endereco.trim() || null,
          data_inicio: startsAt.toISOString(),
          data_fim: endsAt?.toISOString() || null,
        })
        .eq('id', evento.id)
        .eq('empresa_id', empresaId)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!updated) throw new Error('Evento não encontrado ou sem permissão para editar.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['empresa-eventos'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-eventos'] }),
        queryClient.invalidateQueries({ queryKey: ['eventos-publicos'] }),
      ]);
      toast.success('Evento salvo. Mudanças públicas exigem nova aprovação.');
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar o evento.');
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen && submittingRef.current) return;
      onOpenChange(nextOpen);
    }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar evento</DialogTitle>
          <DialogDescription>
            Alterações nas informações públicas serão enviadas novamente para aprovação.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-event-title">Título *</Label>
            <Input id="edit-event-title" value={titulo} onChange={e => setTitulo(e.target.value)} required minLength={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-event-desc">Descrição</Label>
            <Textarea id="edit-event-desc" value={descricao} onChange={e => setDescricao(e.target.value)} rows={3} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-event-start">Início *</Label>
              <Input id="edit-event-start" type="datetime-local" value={inicio} onChange={e => setInicio(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-event-end">Término</Label>
              <Input id="edit-event-end" type="datetime-local" value={fim} onChange={e => setFim(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-event-local">Local</Label>
            <Input id="edit-event-local" value={local} onChange={e => setLocal(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-event-address">Endereço</Label>
            <Input id="edit-event-address" value={endereco} onChange={e => setEndereco(e.target.value)} />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving} aria-busy={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
