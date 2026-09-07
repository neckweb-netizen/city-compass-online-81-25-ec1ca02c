import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const LoyaltyScanner = ({ onRead }: { onRead: (token: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open || !videoRef.current) return;
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
    }).catch(() => {
      toast.error('Não foi possível abrir a câmera. Confira a permissão do navegador.');
      setOpen(false);
    }).finally(() => setLoading(false));

    return () => { stopped = true; controls?.stop(); };
  }, [open, onRead]);

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button type="button" variant="outline"><Camera className="mr-2 h-4 w-4" /> Ler QR Code</Button></DialogTrigger>
    <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Escanear cartão</DialogTitle><DialogDescription>Aponte a câmera para o QR Code exibido no celular do cliente.</DialogDescription></DialogHeader>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-black"><video ref={videoRef} className="h-full w-full object-cover" muted playsInline />{loading && <div className="absolute inset-0 grid place-items-center bg-black/60"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>}<div className="pointer-events-none absolute inset-[15%] rounded-2xl border-2 border-violet-300 shadow-[0_0_0_999px_rgba(0,0,0,.25)]" /></div>
    </DialogContent>
  </Dialog>;
};
