import React, { useEffect, useRef } from 'react';

interface BannerCodeRenderProps {
  codigoHtml: string;
  className?: string;
}

export const BannerCodeRender: React.FC<BannerCodeRenderProps> = ({ codigoHtml, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !codigoHtml) return;

    containerRef.current.innerHTML = codigoHtml;

    // Re-executa todas as tags <script> contidas dentro do código colado
    const scriptElements = Array.from(containerRef.current.querySelectorAll('script'));
    scriptElements.forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      if (oldScript.parentNode) {
        oldScript.parentNode.replaceChild(newScript, oldScript);
      }
    });

    // Se for Google AdSense, dispara o carregamento da ad unit
    try {
      if (codigoHtml.includes('adsbygoogle')) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      console.warn('AdSense push error:', e);
    }
  }, [codigoHtml]);

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full flex items-center justify-center overflow-hidden ${className}`} 
    />
  );
};

