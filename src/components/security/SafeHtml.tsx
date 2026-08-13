import { useMemo } from 'react';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

interface SafeHtmlProps {
  html: string;
  className?: string;
}

export function SafeHtml({ html, className }: SafeHtmlProps) {
  const sanitizedHtml = useMemo(() => sanitizeHtml(html), [html]);
  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
}
