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
          <div className="flex flex-wrap items-center justify-center gap-1 text-sm text-muted-foreground">
            <span>Desenvolvido por</span>
            <span className="inline-flex items-center justify-center gap-1" aria-label="Desenvolvido por Deivid">
              <span className="bg-gradient-to-b from-fuchsia-300 via-purple-500 to-violet-900 bg-clip-text text-sm font-semibold text-transparent">
                Deivid
              </span>
              <span aria-hidden="true" className="relative inline-grid h-4 w-4 shrink-0 place-items-center text-sm leading-none"><span className="absolute motion-safe:animate-[footer-crown-front_3s_linear_infinite]">👑</span><span className="absolute opacity-0 motion-safe:animate-[footer-crown-side_3s_linear_infinite]">👑</span></span>
            </span>
          </div>

          <style>{`@keyframes footer-crown-front { 0%, 50%, 100% { transform: scaleX(1); opacity: 1; } 25%, 75% { transform: scaleX(.78); opacity: 0; } } @keyframes footer-crown-side { 0%, 50%, 100% { transform: scaleX(.78); opacity: 0; } 25%, 75% { transform: scaleX(1); opacity: 1; } }`}</style>
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
