
import { useEffect } from 'react';

export const SecurityHeaders = () => {
  useEffect(() => {
    // Set security headers via meta tags (only for headers that are allowed)
    const setSecurityMeta = () => {
      // Referrer Policy (allowed via meta tag)
      const referrerMeta = document.createElement('meta');
      referrerMeta.name = 'referrer';
      referrerMeta.content = 'strict-origin-when-cross-origin';
      
      // Remove existing security headers
      const existingHeaders = document.querySelectorAll('meta[name="referrer"]');
      existingHeaders.forEach(header => header.remove());
      
      // Add new headers (only those allowed via meta tags)
      document.head.appendChild(referrerMeta);
      
      console.log('🛡️ Security headers applied (via meta tags)');
    };

    setSecurityMeta();
  }, []);

  return null;
};
