import { useEffect, useMemo, useState } from 'react';
import { BellRing, Loader2, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { usePushNotifications } from '@/contexts/PushNotificationsContext';

const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const PROMPT_DELAY_MS = 1_500;

export const PushPermissionPrompt = () => {
  const { user, loading: authLoading } = useAuth();
  const {
    supported,
    permission,
    enabled,
    preferencesReady,
    loading,
    error,
    preferences,
    enable,
  } = usePushNotifications();
  const [visible, setVisible] = useState(false);

  const dismissalKey = useMemo(
    () => user?.id ? `sajtem-push-prompt-dismissed-until:${user.id}` : null,
    [user?.id],
  );

  useEffect(() => {
    setVisible(false);

    if (
      authLoading
      || !user?.id
      || !preferencesReady
      || !supported
      || permission === 'denied'
      || permission === 'unsupported'
      || enabled
      || !preferences.push_enabled
      || !dismissalKey
    ) return;

    const dismissedUntil = Number(localStorage.getItem(dismissalKey) || 0);
    if (dismissedUntil > Date.now()) return;

    const timer = window.setTimeout(() => setVisible(true), PROMPT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [
    authLoading,
    dismissalKey,
    enabled,
    permission,
    preferences.push_enabled,
    preferencesReady,
    supported,
    user?.id,
  ]);

  const handleDismiss = () => {
    if (dismissalKey) {
      localStorage.setItem(dismissalKey, String(Date.now() + DISMISS_DURATION_MS));
    }
    setVisible(false);
  };

  const handleEnable = async () => {
    try {
      await enable();
      if (dismissalKey) localStorage.removeItem(dismissalKey);
      setVisible(false);
    } catch {
      setVisible(true);
    }
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Ativar notificações"
      className="fixed inset-x-3 bottom-[5.75rem] z-[60] mx-auto max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300 md:inset-x-auto md:bottom-6 md:right-6 md:mx-0"
    >
      <div className="overflow-hidden rounded-2xl border border-primary/25 bg-background/95 shadow-2xl backdrop-blur-xl">
        <div className="relative p-4 sm:p-5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Lembrar depois"
            onClick={handleDismiss}
            disabled={loading}
            className="absolute right-2 top-2 h-8 w-8 rounded-full text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex gap-3 pr-7">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <BellRing className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-foreground">Receba avisos importantes</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Ative as notificações para receber novidades e comunicados do Saj Tem mesmo com o site fechado.
              </p>
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Você pode desativar quando quiser.
            </div>
            <Button
              type="button"
              onClick={handleEnable}
              disabled={loading}
              className="rounded-xl px-5 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ativando...
                </>
              ) : (
                <>
                  <BellRing className="mr-2 h-4 w-4" />
                  Ativar notificações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
};
