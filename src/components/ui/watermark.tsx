import React from 'react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';

const FooterCrown = () => (
  <span aria-hidden="true" className="block h-[14px] w-[16px]" style={{ perspective: '70px' }}>
    <style>{`@keyframes sajtem-crown-turn { 0%,100% { transform: rotateY(-45deg); } 50% { transform: rotateY(45deg); } } @media (prefers-reduced-motion: reduce) { .sajtem-crown-turn { animation: none !important; } }`}</style>
    <svg className="sajtem-crown-turn block h-full w-full" style={{ animation: 'sajtem-crown-turn 4.5s ease-in-out infinite', transformOrigin: 'center' }} viewBox="0 0 24 20" fill="none">
      <path d="M2 5 7 10 12 2 17 10 22 5 19 16H5L2 5Z" fill="#EAB308" stroke="#A16207" strokeWidth="1" strokeLinejoin="round"/>
      <path d="M5 16H19V19H5Z" fill="#FACC15" stroke="#A16207" strokeWidth="1"/>
      <path d="M7 13 12 5 17 13" stroke="#FEF08A" strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="12" cy="13" r="1.5" fill="#B91C1C"/>
      <circle cx="2" cy="4" r="1.5" fill="#FDE68A"/><circle cx="12" cy="2" r="1.5" fill="#FDE68A"/><circle cx="22" cy="4" r="1.5" fill="#FDE68A"/>
    </svg>
  </span>
);

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
          <div className="flex flex-wrap items-baseline justify-center gap-x-1 gap-y-0 pt-4 text-sm text-muted-foreground">
            <span>Desenvolvido por</span>
            <span className="relative inline-flex items-baseline" aria-label="Deivid">
              <span aria-hidden="true" className="pointer-events-none absolute bottom-full left-1/2 flex -translate-x-1/2 translate-y-0 z-10"><FooterCrown /></span>
              <span className="bg-gradient-to-b from-fuchsia-300 via-purple-500 to-violet-900 bg-clip-text text-sm font-semibold text-transparent">
                Deivid
              </span>
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
