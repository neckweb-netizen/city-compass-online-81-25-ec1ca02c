import React from 'react';
import { cn } from '@/lib/utils';

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
        </div>
      </div>
    </div>
  );
};