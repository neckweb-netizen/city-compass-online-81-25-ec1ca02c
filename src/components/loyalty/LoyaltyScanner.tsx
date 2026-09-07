import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Keyboard, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const LoyaltyScanner = ({ onRead }: { onRead: (token: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const requestCamera = async () => {
    setLoading(true);
    try {
      if (!window.isSecureContext) throw new Error('A câmera só pode ser usada em uma conexão segura (HTTPS).');
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Este navegador não oferece acesso à câmera.');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionError('');
      setOpen(true);
    } catch (error: any) {
      const denied = error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError';
      setPermissionError(denied
        ? 'A permissão da câmera está bloqueada neste navegador.'
        : error?.message || 'Não foi possível acessar a câmera.');
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || permissionError || !videoRef.current) return;
    let stopped = false;
    let controls: { stop: () => void } | undefined;
    setLoading(true);

    import('@zxing/browser').then(async ({ BrowserQRCodeReader }) => {
      const reader = new BrowserQRCodeReader();
      controls = await reader.decodeFromConstraints(
        { audio: false, video: { facingMode: { ideal: 'environment' } } },
        videoRef.current!,
        (result) => {
          if (!result || stopped) return;
          const raw = result.getText();
          const token = raw.replace(/^sajtem-loyalty:/, '').trim();
          onRead(token);
          setOpen(false);
          toast.success('Cartão identificado!');
        },
      );
    }).catch((error: any) => {
      setPermissionError(error?.name === 'NotAllowedError'
        ? 'A permissão da câmera está bloqueada neste navegador.'
        : 'A câmera foi liberada, mas não pôde ser iniciada. Tente fechar outros aplicativos que estejam usando a câmera.');
    }).finally(() => setLoading(false));

    return () => { stopped = true; controls?.stop(); };
  }, [open, onRead, permissionError]);

  return <>
    <Button type="button" variant="outline" onClick={requestCamera} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />} Usar câmera</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Escanear cartão pelo celular</DialogTitle><DialogDescription>Aponte a câmera traseira para o QR Code exibido pelo cliente.</DialogDescription></DialogHeader>
        {permissionError ? <div className="space-y-4" role="alert" aria-live="polite">
          <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4"><CameraOff className="mb-2 h-7 w-7 text-amber-300" /><p className="font-semibold text-amber-100">{permissionError}</p><p className="mt-2 text-sm text-muted-foreground">No Android/Chrome, toque no cadeado ao lado do endereço, abra <strong>Permissões</strong> e permita a <strong>Câmera</strong>. No iPhone/Safari, toque em <strong>aA</strong>, “Ajustes do Site” e permita a câmera. Depois volte e tente novamente.</p></div>
          <Button type="button" onClick={requestCamera} className="w-full"><RefreshCw className="mr-2 h-4 w-4" /> Pedir permissão novamente</Button>
          <div className="flex gap-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground"><Keyboard className="h-4 w-4 shrink-0" /><span>Sem câmera? Digite o código de 8 caracteres do cliente no campo de busca. Leitores físicos USB/Bluetooth também funcionam nesse campo.</span></div>
        </div> : <div className="relative aspect-square overflow-hidden rounded-2xl bg-black"><video ref={videoRef} className="h-full w-full object-cover" muted playsInline />{loading && <div className="absolute inset-0 grid place-items-center bg-black/60"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>}<div className="pointer-events-none absolute inset-[15%] rounded-2xl border-2 border-violet-300 shadow-[0_0_0_999px_rgba(0,0,0,.25)]" /></div>}
      </DialogContent>
    </Dialog>
  </>;
};
