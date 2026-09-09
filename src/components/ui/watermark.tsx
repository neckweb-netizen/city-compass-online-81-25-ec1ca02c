import React from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface WatermarkProps {
  variant?: 'footer' | 'sidebar';
  className?: string;
}

export const Watermark: React.FC<WatermarkProps> = ({ 
  variant = 'footer', 
  className 
}) => {
  if (variant === 'sidebar') {
    return (
      <div className={cn(
        "text-xs text-muted-foreground/60 text-center border-t pt-2",
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
          <p className="text-sm text-muted-foreground/80">
            Desenvolvido com ❤️ por{' '}
            <span className="font-semibold text-muted-foreground">
              Deivid
            </span>
          </p>
          <nav aria-label="Informações legais" className="mt-2 flex flex-wrap items-center justify-center gap-x-2 text-xs text-muted-foreground/70">
            <Link
              to="/politica-de-privacidade"
              className="min-h-8 rounded-md px-1 py-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Política de Privacidade
            </Link>
            <span aria-hidden="true" className="text-border">•</span>
            <Link
              to="/termos-de-uso"
              className="min-h-8 rounded-md px-1 py-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Termos de Uso
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
};
