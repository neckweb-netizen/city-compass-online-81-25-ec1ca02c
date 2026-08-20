import { FormEvent, ReactNode, useCallback, useEffect, useState } from 'react';
import { Copy, KeyRound, Loader2, LogOut, ShieldCheck, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type GateMode = 'loading' | 'enroll' | 'challenge' | 'verified' | 'error';

interface AdminMfaGateProps {
  children: ReactNode;
  onSignOut: () => Promise<void>;
}

export const AdminMfaGate = ({ children, onSignOut }: AdminMfaGateProps) => {
  const [mode, setMode] = useState<GateMode>('loading');
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const initializeMfa = useCallback(async () => {
    setMode('loading');
    setError('');

    const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance.error) throw assurance.error;
    if (assurance.data.currentLevel === 'aal2') {
      setMode('verified');
      return;
    }

    const factors = await supabase.auth.mfa.listFactors();
    if (factors.error) throw factors.error;

    const verifiedFactor = factors.data.totp.find((factor) => factor.status === 'verified');
    if (verifiedFactor) {
      setFactorId(verifiedFactor.id);
      setMode('challenge');
      return;
    }

    for (const staleFactor of factors.data.totp) {
      await supabase.auth.mfa.unenroll({ factorId: staleFactor.id }).catch(() => undefined);
    }

    const enrollment = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Painel administrativo Saj Tem',
    });
    if (enrollment.error) throw enrollment.error;

    setFactorId(enrollment.data.id);
    setQrCode(enrollment.data.totp.qr_code);
    setSecret(enrollment.data.totp.secret);
    setMode('enroll');
  }, []);

  useEffect(() => {
    void initializeMfa().catch((initializationError) => {
      console.error('Falha ao preparar MFA administrativo:', initializationError);
      setError(initializationError instanceof Error ? initializationError.message : 'Não foi possível preparar a autenticação em dois fatores.');
      setMode('error');
    });
  }, [initializeMfa]);

  useEffect(() => {
    if (mode !== 'verified') return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const renewTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => void onSignOut(), 30 * 60 * 1000);
    };
    const activityEvents = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((event) => window.addEventListener(event, renewTimeout, { passive: true }));
    renewTimeout();

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach((event) => window.removeEventListener(event, renewTimeout));
    };
  }, [mode, onSignOut]);

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('Digite o código de 6 números do aplicativo autenticador.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verification = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code,
      });
      if (verification.error) throw verification.error;

      await supabase.auth.refreshSession();
      const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance.error || assurance.data.currentLevel !== 'aal2') {
        throw assurance.error || new Error('A confirmação do segundo fator não foi concluída.');
      }

      setCode('');
      setMode('verified');
    } catch (verificationError) {
      console.error('Falha ao confirmar MFA administrativo:', verificationError);
      setError('Código inválido ou expirado. Aguarde o próximo código e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === 'verified') return <>{children}</>;

  return (
    <div className="min-h-screen bg-background px-4 py-10 flex items-center justify-center">
      <Card className="w-full max-w-lg border-primary/20 shadow-2xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {mode === 'loading' ? <Loader2 className="h-7 w-7 animate-spin" /> : <ShieldCheck className="h-7 w-7" />}
          </div>
          <CardTitle className="text-2xl">Proteção do painel administrativo</CardTitle>
          <p className="text-sm text-muted-foreground">
            O painel exige um código temporário além da sua senha para impedir acessos indevidos.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          {mode === 'loading' && (
            <p className="text-center text-sm text-muted-foreground">Verificando a segurança da sua sessão…</p>
          )}

          {mode === 'enroll' && (
            <>
              <div className="rounded-xl border bg-muted/30 p-4 text-sm space-y-2">
                <p className="font-semibold flex items-center gap-2"><Smartphone className="h-4 w-4" /> Primeira configuração</p>
                <p className="text-muted-foreground">Abra Google Authenticator, Microsoft Authenticator ou outro aplicativo TOTP e escaneie o QR Code.</p>
              </div>
              {qrCode && <img src={qrCode} alt="QR Code para configurar autenticação em dois fatores" className="mx-auto h-52 w-52 rounded-xl bg-white p-3" />}
              {secret && (
                <div className="rounded-lg border p-3">
                  <p className="mb-2 text-xs text-muted-foreground">Se não conseguir escanear, informe esta chave manualmente:</p>
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 break-all text-xs">{secret}</code>
                    <Button type="button" size="icon" variant="ghost" onClick={() => void navigator.clipboard.writeText(secret)} title="Copiar chave">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {mode === 'challenge' && (
            <div className="rounded-xl border bg-muted/30 p-4 text-sm">
              <p className="font-semibold flex items-center gap-2"><KeyRound className="h-4 w-4" /> Confirme sua identidade</p>
              <p className="mt-1 text-muted-foreground">Digite o código atual exibido no seu aplicativo autenticador.</p>
            </div>
          )}

          {(mode === 'enroll' || mode === 'challenge') && (
            <form onSubmit={verifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-mfa-code">Código de 6 números</Label>
                <Input
                  id="admin-mfa-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  className="h-12 text-center text-xl tracking-[0.35em]"
                  autoFocus
                />
              </div>
              {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting || code.length !== 6}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Confirmar e acessar o painel
              </Button>
            </form>
          )}

          {mode === 'error' && (
            <div className="space-y-4">
              <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
              <Button type="button" variant="outline" className="w-full" onClick={() => void initializeMfa()}>
                Tentar novamente
              </Button>
            </div>
          )}

          {mode !== 'loading' && (
            <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={() => void onSignOut()}>
              <LogOut className="mr-2 h-4 w-4" /> Sair da conta
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
