import React from 'react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';

const FooterCrown = () => {
  const [angle, setAngle] = React.useState(0);
  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    let start: number | undefined;
    const tick = (time: number) => {
      start ??= time;
      setAngle(((time - start) % 3000) / 3000 * Math.PI * 2);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  const point = (a: number, r: number, y: number) => [12 + Math.cos(a) * r, y + Math.sin(a) * r * .23];
  const faces = Array.from({ length: 5 }, (_, i) => {
    const mid = angle + i * Math.PI * 2 / 5;
    const a = mid - Math.PI / 5, b = mid + Math.PI / 5;
    const p = [point(a, 8, 18), point(b, 8, 18), point(b, 9, 10), point(mid, 10, 3), point(a, 9, 10)];
    return { i, depth: Math.sin(mid), p, tip: p[3], jewel: point(mid, 8.2, 15) };
  }).sort((a, b) => a.depth - b.depth);
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 overflow-visible">
      <ellipse cx="12" cy="18" rx="8" ry="2" fill="#9b590c" />
      {faces.map(f => (
        <g key={f.i}>
          <polygon points={f.p.map(p => p.join(',')).join(' ')} fill={f.depth > 0 ? '#f9c746' : '#b87913'} stroke="#9b590c" strokeWidth=".45" strokeLinejoin="round" />
          <circle cx={f.tip[0]} cy={f.tip[1]} r="1" fill="#ffe99a" stroke="#b87913" strokeWidth=".3" />
          {f.depth > 0 && <circle cx={f.jewel[0]} cy={f.jewel[1]} r="1.1" fill={f.i % 2 ? '#d43c76' : '#39b7ba'} />}
        </g>
      ))}
      <path d="M4 18 Q12 22 20 18 L20 20 Q12 24 4 20Z" fill="#e9a923" stroke="#9b590c" strokeWidth=".45" />
      <path d="M5 19 Q12 22 19 19" fill="none" stroke="#fff0a1" strokeWidth=".6" />
    </svg>
  );
};

interface WatermarkProps {
  variant?: 'footer' | 'sidebar';
  className?: string;
}

export const Watermark: React.FC<WatermarkProps> = ({ 
  variant = 'footer', 
  className 
}) => {
  const location = useLocation();
  if (variant === 'sidebar') {
    return (
      <div className={cn(
        "text-xs text-muted-foreground text-center border-t pt-2",
        className
      )}>
        <span className="font-medium">Made By Deivid</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "w-full py-6 border-t bg-muted/20",
      className
    )}>
      <div className="container mx-auto px-4">
        <div className="text-center">
          <div className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground">
            <span>Desenvolvido por</span>
            <span className="inline-flex items-center justify-center gap-1" aria-label="Desenvolvido por Deivid">
              <span className="bg-gradient-to-b from-fuchsia-300 via-purple-500 to-violet-900 bg-clip-text text-sm font-semibold text-transparent">
                Deivid
              </span>
              <FooterCrown />
            </span>
          </div>

          <nav aria-label="Informações e ajuda" className="mt-2 flex flex-wrap items-center justify-center gap-x-3 text-xs text-muted-foreground">
            {location.pathname === '/' && (
              <>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event('sajtem:start-visitor-tour'))}
                  className="inline-flex min-h-11 items-center rounded-lg px-2 py-2 font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Como usar o Saj Tem
                </button>
                <span aria-hidden="true" className="text-border">•</span>
              </>
            )}
            <Link
              to="/politica-de-privacidade"
              className="inline-flex min-h-11 items-center rounded-lg px-2 py-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Política de Privacidade
            </Link>
            <span aria-hidden="true" className="text-border">•</span>
            <Link
              to="/termos-de-uso"
              className="inline-flex min-h-11 items-center rounded-lg px-2 py-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Termos de Uso
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
};
