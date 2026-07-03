12:29:50.178 Running build in Washington, D.C., USA (East) – iad1
12:29:50.179 Build machine configuration: 2 cores, 8 GB
12:29:50.287 Cloning github.com/neckweb-netizen/city-compass-online-81-25-ec1ca02c (Branch: main, Commit: 138b0df)
12:29:50.879 Cloning completed: 591.000ms
12:29:51.086 Restored build cache from previous deployment (DvKFJsHW2SDUgAarKkuUCb9nf11y)
12:29:51.352 Running "vercel build"
12:29:51.372 Vercel CLI 54.19.0
12:29:52.054 Installing dependencies...
12:29:53.502 
12:29:53.502 up to date in 1s
12:29:53.502 
12:29:53.503 74 packages are looking for funding
12:29:53.503   run `npm fund` for details
12:29:53.540 Running "npm run build"
12:29:53.642 
12:29:53.642 > vite_react_shadcn_ts@0.0.0 build
12:29:53.642 > vite build
12:29:53.643 
12:29:53.913 vite v5.4.10 building for production...
12:29:53.988 transforming...
12:29:54.246 Browserslist: browsers data (caniuse-lite) is 21 months old. Please run:
12:29:54.247   npx update-browserslist-db@latest
12:29:54.247   Why you should do it regularly: https://github.com/browserslist/update-db#readme
12:29:56.418 ✓ 108 modules transformed.
12:29:56.419 x Build failed in 2.48s
12:29:56.420 error during build:
12:29:56.420 [vite:esbuild] Transform failed with 1 error:
12:29:56.420 /vercel/path0/src/components/pwa/PWAInstallPrompt.tsx:105:47: ERROR: Expected ";" but found "Choice"
12:29:56.420 file: /vercel/path0/src/components/pwa/PWAInstallPrompt.tsx:105:47
12:29:56.420 
12:29:56.420 Expected ";" but found "Choice"
12:29:56.420 103|        logPWAEvent('clique_instalar');
12:29:56.420 104|        deferredPrompt.prompt();
12:29:56.420 105|        const { outcome } = await deferredPrompt Choice;
12:29:56.420    |                                                 ^
12:29:56.420 106|        
12:29:56.420 107|        if (outcome === 'accepted') {
12:29:56.420 
12:29:56.420     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1472:15)
12:29:56.421     at /vercel/path0/node_modules/esbuild/lib/main.js:755:50
12:29:56.421     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:622:9)
12:29:56.421     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:677:12)
12:29:56.421     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:600:7)
12:29:56.421     at Socket.emit (node:events:509:28)
12:29:56.421     at addChunk (node:internal/streams/readable:563:12)
12:29:56.421     at readableAddChunkPushByteMode (node:internal/streams/readable:514:3)
12:29:56.421     at Readable.push (node:internal/streams/readable:394:5)
12:29:56.421     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)
12:29:56.452 Error: Command "npm run build" exited with 1      
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

  // Não mostrar se já estiver rodando em modo de app isolado
  if (isStandalone) {
    return null;
  }

  // Banner no topo
  if (showBanner && !showFullPrompt) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary via-primary to-primary/95 text-primary-foreground shadow-xl border-b border-primary-foreground/10 animate-in slide-in-from-top duration-500">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md overflow-hidden flex-shrink-0 p-1">
              <img 
                src="/Logo.png" 
                alt="Saj Tem Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = "/favicon.png";
                }}
              />
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
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-xl overflow-hidden p-2">
                    <img 
                      src="/Logo.png" 
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
