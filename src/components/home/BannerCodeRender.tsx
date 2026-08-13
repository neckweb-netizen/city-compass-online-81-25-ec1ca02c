import React from 'react';
import { SafeHtml } from '@/components/security/SafeHtml';

interface BannerCodeRenderProps {
  codigoHtml: string;
  className?: string;
}

export const BannerCodeRender: React.FC<BannerCodeRenderProps> = ({ codigoHtml, className = '' }) => {
  return <SafeHtml html={codigoHtml} className={`w-full h-full flex items-center justify-center overflow-hidden ${className}`} />;
};
