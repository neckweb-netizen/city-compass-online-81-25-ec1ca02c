import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface EditOwnReviewProps {
  id: string;
  userId: string;
  currentRating: number;
  currentComment: string | null;
}
export const EditOwnReview = ({ id, userId, currentRating, currentComment }: EditOwnReviewProps) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(currentRating);
  const [comment, setComment] = useState(currentComment || '');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const queryClient = useQueryClient();

  const save = async () => {
    if (savingRef.current) return;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length > 4000) {
      toast.error('Informe uma nota de 1 a 5 e até 4.000 caracteres.');
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('avaliacoes')
        .update({ nota: rating, comentario: comment.trim() || null })
        .eq('id', id).eq('usuario_id', userId).select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Avaliação não encontrada ou sem permissão.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-avaliacoes', userId] }),
        queryClient.invalidateQueries({ queryKey: ['empresa-avaliacoes'] }),
        queryClient.invalidateQueries({ queryKey: ['empresa-estatisticas-avaliacoes'] }),
      ]);
      toast.success('Avaliação atualizada.');
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível editar a avaliação.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 space-y-3">
      <Button type="button" size="sm" variant="outline" className="min-h-10"
        disabled={saving} onClick={() => setOpen(v => !v)}>{open ? 'Fechar edição' : 'Editar avaliação'}</Button>
      {open && <div className="space-y-3 rounded-lg border p-3">
        <label htmlFor={`nota-${id}`} className="block text-sm font-medium">Sua nota</label>
        <select id={`nota-${id}`} value={rating}
          onChange={e => setRating(Number(e.target.value))} className="w-full rounded-md border bg-background p-2">
          {[1,2,3,4,5].map(value => <option key={value} value={value}>{value} {value === 1 ? 'estrela' : 'estrelas'}</option>)}
        </select>
        <label htmlFor={`comentario-${id}`} className="block text-sm font-medium">Seu comentário</label>
        <Textarea id={`comentario-${id}`} value={comment} maxLength={4000}
          onChange={e => setComment(e.target.value)} rows={3} />
        <Button type="button" size="sm" disabled={saving} onClick={() => { void save(); }}>
          {saving ? 'Salvando...' : 'Salvar avaliação'}
        </Button>
      </div>}
    </div>
  );
};
