import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Mantido no nível global: links de recuperação abrem uma nova sessão
// mesmo quando o formulário de login não está visível.
export const PasswordRecoveryHandler = () => {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (active && event === 'PASSWORD_RECOVERY') setOpen(true);
    });

    // Recupera a interface após um refresh durante o fluxo de redefinição.
    if (new URLSearchParams(window.location.search).has('password_recovery')) {
      void supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (!active) return;
        if (session && !error) setOpen(true);
        else toast.error('Link de recuperação inválido ou expirado. Solicite outro e-mail.');
      }).catch(() => {
        if (active) toast.error('Não foi possível validar o link de recuperação.');
      });
    }

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (password.length < 8) {
      toast.error('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmation) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setSaving(true);
    try {
      const { data: { user }, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !user) throw new Error('Link de recuperação expirado. Solicite outro e-mail.');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword('');
      setConfirmation('');
      setOpen(false);
      window.history.replaceState(null, '', window.location.pathname);
      toast.success('Senha atualizada! Você já pode usar sua nova senha.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível alterar a senha.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!saving) setOpen(nextOpen); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Definir nova senha</DialogTitle>
          <DialogDescription>Escolha uma nova senha com pelo menos 8 caracteres.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(event) => { void handleSave(event); }}>
          <div className="space-y-2">
            <Label htmlFor="recovery-password">Nova senha</Label>
            <Input id="recovery-password" type="password" autoComplete="new-password"
              minLength={8} required value={password}
              onChange={(event) => setPassword(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recovery-confirm-password">Confirmar nova senha</Label>
            <Input id="recovery-confirm-password" type="password" autoComplete="new-password"
              minLength={8} required value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)} />
          </div>
          <Button className="w-full" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Atualizar senha'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
