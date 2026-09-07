import { useEffect, useState } from 'react';

export const LoyaltyQRCode = ({ token, size = 180 }: { token: string; size?: number }) => {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let active = true;
    import('qrcode').then(({ toDataURL }) => toDataURL(`sajtem-loyalty:${token}`, {
      width: size,
      margin: 1,
      color: { dark: '#171022', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })).then((url) => active && setSrc(url));
    return () => { active = false; };
  }, [token, size]);

  return src ? <img src={src} width={size} height={size} alt="QR Code do cartão fidelidade" className="rounded-xl" /> : (
    <div className="animate-pulse rounded-xl bg-muted" style={{ width: size, height: size }} aria-label="Gerando QR Code" />
  );
};
