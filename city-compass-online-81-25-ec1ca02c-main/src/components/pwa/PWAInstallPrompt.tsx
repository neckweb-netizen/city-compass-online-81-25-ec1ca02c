import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone, Plus, Zap, Bell, Wifi, Gauge } from 'lucide-react';

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

  useEffect(() => {
    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Verificar se já está instalado
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Verificar se já foi dispensado
    const lastDismissed = localStorage.getItem('pwa-banner-dismissed');
    const isDismissed = lastDismissed && Date.now() - parseInt(lastDismissed) < 24 * 60 * 60 * 1000;

    // Listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Mostrar banner após 1 minuto se não estiver instalado e não foi dispensado
      if (!standalone && !isDismissed) {
        setTimeout(() => {
          setShowBanner(true);
        }, 60000); // 1 minuto
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Para iOS, mostrar banner após 1 minuto
    if (iOS && !standalone && !isDismissed) {
      setTimeout(() => {
        setShowBanner(true);
      }, 60000); // 1 minuto
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
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
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  const handleCloseFullPrompt = () => {
    setShowFullPrompt(false);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  // Não mostrar se já está instalado
  if (isStandalone) {
    return null;
  }

  // Banner no topo - design mais elegante
  if (showBanner && !showFullPrompt) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary via-primary to-primary/95 text-primary-foreground shadow-xl border-b border-primary-foreground/10 animate-in slide-in-from-top duration-500">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-foreground/20 to-primary-foreground/30 rounded-xl flex items-center justify-center shadow-inner">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight">Instale o Saj Tem</p>
              <p className="text-sm opacity-90 font-medium">Experiência otimizada e notificações</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleBannerClick}
              variant="secondary"
              size="sm"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/95 font-semibold px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Instalar
            </Button>
            <Button
              onClick={handleCloseBanner}
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/20 rounded-full w-8 h-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Prompt em tela cheia
  if (!showFullPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex items-center justify-center min-h-screen p-6">
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
              {/* Header com ícone e título */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-xl">
                    <Smartphone className="h-8 w-8 text-primary-foreground" />
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-2 text-foreground">
                  Instalar Saj Tem
                </h2>
                <p className="text-muted-foreground text-sm">
                  Transforme sua experiência com nosso app
                </p>
              </div>

              {/* Benefícios com ícones modernos */}
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
              
              {/* Botão de instalação ou instruções iOS */}
              <div className="p-6 pt-0">
                {isIOS ? (
                  <div className="bg-muted/50 rounded-xl p-5 space-y-4">
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