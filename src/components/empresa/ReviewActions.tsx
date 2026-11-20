import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useResponderAvaliacao } from '@/hooks/useAvaliacoes';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ReviewActionsProps {
  reviewId: string;
  companyId: string;
  companyOwnerId?: string | null;
  reviewerId: string;
  existingReply?: string | null;
}

export const ReviewActions = ({
  reviewId, companyId, companyOwnerId, reviewerId, existingReply
}: ReviewActionsProps) => {
  const { user } = useAuth();
  const isOwner = Boolean(user && user.id === companyOwnerId);
  const canReport = Boolean(user && user.id !== reviewerId);
  const [replyOpen, setReplyOpen] = useState(false);
  const [reply, setReply] = useState(existingReply || '');
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const reportRef = useRef(false);
  const respond = useResponderAvaliacao();

  const report = async () => {
    if (!user || reportRef.current) return;
    const value = reason.trim();
    if (value.length < 5 || value.length > 500) {
      toast.error('Descreva o motivo em 5 a 500 caracteres.');
      return;
    }
    reportRef.current = true;
    setReporting(true);
    try {
      const { error } = await supabase.from('denuncias_avaliacoes' as any).insert({
        avaliacao_id: reviewId,
        usuario_id: user.id,
        motivo: value,
      } as any);
      if (error) throw error;
      toast.success('Denúncia enviada para moderação.');
      setReason('');
      setReportOpen(false);
    } catch (error: any) {
      toast.error(error?.code === '23505' ? 'Você já denunciou esta avaliação.' : 'Não foi possível enviar a denúncia.');
    } finally {
      reportRef.current = false;
      setReporting(false);
    }
  };

  if (!isOwner && !canReport) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        {isOwner && (
          <Button size="sm" variant="outline" className="min-h-10"
            onClick={() => setReplyOpen(v => !v)} disabled={respond.isPending}>
            {existingReply ? 'Editar resposta' : 'Responder avaliação'}
          </Button>
        )}
        {canReport && (
          <Button size="sm" variant="ghost" className="min-h-10"
            onClick={() => setReportOpen(v => !v)}>Denunciar</Button>
        )}
      </div>
      {isOwner && replyOpen && (
        <div className="space-y-2">
          <label htmlFor={`resposta-${reviewId}`} className="text-sm font-medium">Resposta pública da empresa</label>
          <Textarea id={`resposta-${reviewId}`} value={reply} maxLength={2000}
            onChange={e => setReply(e.target.value)} placeholder="Responda à experiência relatada..." />
          <Button size="sm" disabled={respond.isPending || !reply.trim()}
            onClick={() => respond.mutate(
              { id: reviewId, empresaId: companyId, resposta: reply },
              { onSuccess: () => setReplyOpen(false) }
            )}>
            {respond.isPending ? 'Salvando...' : 'Publicar resposta'}
          </Button>
        </div>
      )}
      {canReport && reportOpen && (
        <div className="space-y-2">
          <label htmlFor={`denuncia-${reviewId}`} className="text-sm font-medium">Motivo da denúncia</label>
          <Textarea id={`denuncia-${reviewId}`} value={reason} maxLength={500}
            onChange={e => setReason(e.target.value)} placeholder="Explique o problema encontrado..." />
          <Button size="sm" disabled={reporting || reason.trim().length < 5}
            onClick={() => { void report(); }}>
            {reporting ? 'Enviando...' : 'Enviar denúncia'}
          </Button>
        </div>
      )}
    </div>
  );
};
