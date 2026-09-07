import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Keyboard, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type ScannerControls = { stop: () => void };

const getCameraErrorMessage = (error: unknown) => {
  const cameraError = error as { name?: string; message?: string };

  if (cameraError?.name === 'NotAllowedError' || cameraError?.name === 'PermissionDeniedError') {
    return 'A permissão da câmera está bloqueada neste navegador.';
  }
  if (cameraError?.name === 'NotReadableError' || cameraError?.name === 'TrackStartError') {
    return 'A câmera está sendo usada por outro aplicativo. Feche outros leitores ou aplicativos de câmera e tente novamente.';
  }
  if (cameraError?.name === 'NotFoundError' || cameraError?.name === 'DevicesNotFoundError') {
    return 'Nenhuma câmera disponível foi encontrada neste aparelho.';
  }
  if (cameraError?.name === 'OverconstrainedError' || cameraError?.name === 'ConstraintNotSatisfiedError') {
    return 'A câmera deste aparelho não é compatível com a configuração solicitada.';
  }

  return cameraError?.message || 'Não foi possível iniciar a câmera neste aparelho.';
};

export const LoyaltyScanner = ({ onRead }: { onRead: (token: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [streamVersion, setStreamVersion] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const onReadRef = useRef(onRead);

  useEffect(() => {
    onReadRef.current = onRead;
  }, [onRead]);

  const stopCamera = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const requestCamera = async () => {
    setLoading(true);
    setCameraError('');
    stopCamera();

    try {
      if (!window.isSecureContext) throw new Error('A câmera só pode ser usada em uma conexão segura (HTTPS).');
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Este navegador não oferece acesso à câmera.');

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' } },
        });
      } catch (error) {
        const cameraError = error as { name?: string };
        if (cameraError?.name !== 'OverconstrainedError' && cameraError?.name !== 'ConstraintNotSatisfiedError') throw error;
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      }

      streamRef.current = stream;
      setOpen(true);
      setStreamVersion((version) => version + 1);
    } catch (error) {
      setCameraError(getCameraErrorMessage(error));
      setOpen(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || cameraError || !videoRef.current || !streamRef.current) return;

    let active = true;
    const stream = streamRef.current;

    void (async () => {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser');
        if (!active) return;

        const reader = new BrowserQRCodeReader(undefined, {
          delayBetweenScanAttempts: 150,
          delayBetweenScanSuccess: 500,
          tryPlayVideoTimeout: 10000,
        });
        const controls = await reader.decodeFromStream(stream, videoRef.current!, (result) => {
          if (!result || !active) return;
          const token = result.getText().replace(/^sajtem-loyalty:/, '').trim();
          onReadRef.current(token);
          setOpen(false);
          toast.success('Cartão identificado!');
        });

        if (!active) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setLoading(false);
      } catch (error) {
        if (!active) return;
        stopCamera();
        setCameraError(getCameraErrorMessage(error));
        setLoading(false);
      }
    })();

    return () => {
      active = false;
      stopCamera();
    };
  }, [cameraError, open, streamVersion]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      stopCamera();
      setLoading(false);
      setCameraError('');
    }
    setOpen(nextOpen);
  };

  return <>
    <Button type="button" variant="outline" onClick={requestCamera} disabled={loading}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
      Usar câmera
    </Button>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear cartão pelo celular</DialogTitle>
          <DialogDescription>Aponte a câmera traseira para o QR Code exibido pelo cliente.</DialogDescription>
        </DialogHeader>
        {cameraError ? <div className="space-y-4" role="alert" aria-live="polite">
          <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
            <CameraOff className="mb-2 h-7 w-7 text-amber-300" />
            <p className="font-semibold text-amber-100">{cameraError}</p>
            <p className="mt-2 text-sm text-muted-foreground">No Android/Chrome, toque no cadeado ao lado do endereço, abra <strong>Permissões</strong> e permita a <strong>Câmera</strong>. No iPhone/Safari, toque em <strong>aA</strong>, “Ajustes do Site” e permita a câmera. Depois volte e tente novamente.</p>
          </div>
          <Button type="button" onClick={requestCamera} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" /> Tentar abrir a câmera novamente
          </Button>
          <div className="flex gap-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
            <Keyboard className="h-4 w-4 shrink-0" />
            <span>Sem câmera? Digite o código de 8 caracteres do cliente no campo de busca. Leitores físicos USB/Bluetooth também funcionam nesse campo.</span>
          </div>
        </div> : <div className="relative aspect-square overflow-hidden rounded-2xl bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
          {loading && <div className="absolute inset-0 z-10 grid place-items-center bg-black/60">
            <div className="flex flex-col items-center gap-3 text-white"><Loader2 className="h-8 w-8 animate-spin" /><span className="text-sm">Iniciando câmera…</span></div>
          </div>}
          <div className="pointer-events-none absolute inset-[15%] rounded-2xl border-2 border-violet-300 shadow-[0_0_0_999px_rgba(0,0,0,.25)]" />
        </div>}
      </DialogContent>
    </Dialog>
  </>;
};
