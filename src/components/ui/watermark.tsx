import React from 'react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';

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
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span>Desenvolvido por</span>
            <span className="inline-flex items-center gap-1.5" aria-label="David Jorge">
              <span className="bg-gradient-to-b from-fuchsia-300 via-purple-600 to-violet-900 bg-clip-text text-lg font-black italic tracking-tight text-transparent drop-shadow-sm">
                David Jorge
              </span>
              <svg viewBox="0 0 64 52" role="img" aria-label="Coroa dourada animada" className="h-9 w-11 shrink-0 overflow-visible">
                <defs>
                  <linearGradient id="footer-crown-gold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#fff2a6" />
                    <stop offset=".36" stopColor="#ffda3a" />
                    <stop offset=".7" stopColor="#d99500" />
                    <stop offset="1" stopColor="#fff0a0" />
                  </linearGradient>
                </defs>
                <g className="origin-center motion-safe:animate-[footer-crown-turn_2s_ease-in-out_infinite]">
                  <path d="M6 15 20 26 32 5 44 26 58 15 54 43 10 43Z" fill="url(#footer-crown-gold)" stroke="#ab6e05" strokeWidth="2" strokeLinejoin="round"/>
                  <rect x="10" y="38" width="44" height="9" rx="4" fill="url(#footer-crown-gold)" stroke="#ab6e05" strokeWidth="1.5" />
                  <circle cx="20" cy="41.5" r="3.2" fill="#ea29c5" />
                  <circle cx="32" cy="41.5" r="4" fill="#12b7a9" />
                  <circle cx="44" cy="41.5" r="3.2" fill="#ea29c5" />
                  <path d="m13 29 6 5" stroke="#fff6bc" strokeWidth="2" strokeLinecap="round" />
                </g>
              </svg>
            </span>
          </div>
          <style>{`@keyframes footer-crown-turn { 0%,100% { transform: perspective(90px) rotateY(0deg) } 50% { transform: perspective(90px) rotateY(180deg) } }`}</style>
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
