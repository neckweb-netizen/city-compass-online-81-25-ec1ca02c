import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Zap, Bell, Wifi, Gauge } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PWA_DISMISSED_AT_KEY = 'pwa-install-dismissed-at';
const PWA_DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Função interna para registrar métricas anonimamente no Supabase
  const logPWAEvent = async (evento: string) => {
    try {
      let plataforma = 'Android/PC';
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) plataforma = 'iOS';
      else if (/Macintosh/.test(navigator.userAgent)) plataforma = 'MacOS';
      else if (/Windows/.test(navigator.userAgent)) plataforma = 'Windows';

      const { error } = await supabase
        .from('estatisticas_pwa' as any)
        .insert([{ evento, plataforma }]);

      if (error && import.meta.env.DEV) {
        console.warn('Não foi possível registrar a métrica do PWA:', error.message);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Não foi possível registrar a métrica do PWA:', err);
    }
  };

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Verificar se já está instalado e rodando em modo nativo
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Se o usuário entrou no site usando o PWA já instalado, computa um acesso standalone diário
    if (standalone) {
      const lastSessionLog = sessionStorage.getItem('pwa-session-logged');
      if (!lastSessionLog) {
        logPWAEvent('acesso_standalone');
        sessionStorage.setItem('pwa-session-logged', 'true');
      }
    }

    const dismissedAt = Number(localStorage.getItem(PWA_DISMISSED_AT_KEY) || 0);
    const wasRecentlyDismissed = dismissedAt > 0 && Date.now() - dismissedAt < PWA_DISMISS_DURATION_MS;

    // Listener nativo do navegador para interceptar se o app é elegível para instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      if (!wasRecentlyDismissed) {
        setShowBanner(true);
        logPWAEvent('banner_exibido');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listener para capturar o exato momento em que a instalação é finalizada no Chromium/Android
    const handleAppInstalled = () => {
      logPWAEvent('instalado_com_sucesso');
      setDeferredPrompt(null);
      setShowBanner(false);
      setShowFullPrompt(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // No iOS não há evento beforeinstallprompt; exibimos as instruções uma vez por período.
    if (iOS && !standalone && !wasRecentlyDismissed) {
      setShowBanner(true);
      logPWAEvent('banner_exibido');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      logPWAEvent('clique_instalar');
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowFullPrompt(false);
        setShowBanner(false);
      }
    }
  };

  const handleBannerClick = () => {
    setShowBanner(false);
    setShowFullPrompt(true);
  };

  const handleCloseBanner = () => {
    setShowBanner(false);
    localStorage.setItem(PWA_DISMISSED_AT_KEY, String(Date.now()));
    logPWAEvent('banner_fechado');
  };

  const handleCloseFullPrompt = () => {
    setShowFullPrompt(false);
    localStorage.setItem(PWA_DISMISSED_AT_KEY, String(Date.now()));
    logPWAEvent('prompt_fechado');
  };

  // Não mostrar se já estiver rodando em modo de app isolado
  if (isStandalone) {
    return null;
  }

  // Card flutuante: não interfere no header fixo nem no menu inferior mobile.
  if (showBanner && !showFullPrompt) {
    return (
      <aside
        aria-label="Instalar aplicativo Saj Tem"
        className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[60] mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300 lg:inset-x-auto lg:bottom-5 lg:right-5 lg:mx-0 lg:w-[390px]"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-primary-foreground/15 bg-gradient-to-r from-primary via-primary to-primary/90 p-3 text-primary-foreground shadow-2xl backdrop-blur-xl sm:p-4">
          <button type="button" onClick={handleBannerClick} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label="Ver opções para instalar o Saj Tem">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white p-1 shadow-md">
              <img 
                src="/icon-192.png"
                alt="Saj Tem Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = "/favicon.png";
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight sm:text-base">Instale o Saj Tem</p>
              <p className="truncate text-xs font-medium opacity-85 sm:text-sm">Acesso rápido e notificações</p>
            </div>
          </button>
          <Button onClick={handleBannerClick} variant="secondary" size="sm" className="hidden shrink-0 rounded-full bg-primary-foreground px-4 font-semibold text-primary shadow-lg hover:bg-primary-foreground/95 min-[360px]:inline-flex">Instalar</Button>
          <Button onClick={handleCloseBanner} variant="ghost" size="icon" aria-label="Fechar aviso de instalação" className="h-9 w-9 shrink-0 rounded-full text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"><X className="h-4 w-4" /></Button>
        </div>
      </aside>
    );
  }

  // Prompt em tela cheia
  if (!showFullPrompt) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex min-h-[100dvh] items-center justify-center p-6">
        <div className="relative w-full max-w-sm mx-auto animate-in zoom-in-95 duration-300">
          {/* Close Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCloseFullPrompt}
            className="absolute -top-14 right-0 h-10 w-10 rounded-full bg-background/80 hover:bg-background shadow-lg"
          >
            <X className="h-5 w-5" />
          </Button>

          <Card className="border-0 shadow-2xl bg-background/95 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-xl overflow-hidden p-2">
                    <img 
                      src="/icon-192.png"
                      alt="Saj Tem Logo" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "/favicon.png";
                      }}
                    />
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-2 text-foreground">
                  Instalar Saj Tem
                </h2>
                <p className="text-muted-foreground text-sm">
                  Transforme sua experiência com nosso app
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Acesso instantâneo sem navegador</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/50 flex items-center justify-center">
                    <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Funciona offline quando disponível</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Notificações em tempo real</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center">
                    <Gauge className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Interface otimizada e mais rápida</span>
                </div>
              </div>
              
              <div className="p-6 pt-0">
                {isIOS ? (
                  <div className="bg-muted/50 rounded-xl p-5 space-y-4" onClick={() => logPWAEvent('clique_instalar_ios')}>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shadow-md">1</div>
                      <span className="text-sm font-medium">Toque no ícone de compartilhar</span>
                      <span className="text-lg">⬆️</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shadow-md">2</div>
                      <span className="text-sm font-medium">Selecione "Adicionar à Tela Inicial"</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shadow-md">3</div>
                      <span className="text-sm font-medium">Toque em "Adicionar"</span>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={handleInstallClick}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                    size="lg"
                  >
                    <Download className="h-5 w-5 mr-3" />
                    Instalar Aplicativo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
