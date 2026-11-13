declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const TRACKING_ID = 'G-F7DPYTC96C';
let initialized = false;
let scheduled = false;

/**
 * Preserve the analytics event queue immediately, but don't compete with the
 * home hero image for network/CPU until after the initial page load.
 */
export const initGA = () => {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => { window.dataLayer.push(args); };
  window.gtag('js', new Date());
  window.gtag('config', TRACKING_ID, { send_page_view: false });

  const loadScript = () => {
    if (document.getElementById('google-analytics-script')) return;
    const script = document.createElement('script');
    script.id = 'google-analytics-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${TRACKING_ID}`;
    document.head.appendChild(script);
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    // Delay network competition with the banner, not event collection.
    window.setTimeout(loadScript, 5500);
  };

  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });

  // If someone interacts before the deferred load, start analytics then.
  window.addEventListener('pointerdown', loadScript, { once: true, passive: true });
  window.addEventListener('keydown', loadScript, { once: true });
};

// Queue page views even when the remote analytics script hasn't loaded yet.
export const logPageView = (path: string) => {
  initGA();
  window.setTimeout(() => {
    window.gtag('config', TRACKING_ID, {
      page_path: path,
      page_title: document.title || 'Saj Tem',
      page_location: window.location.href,
    });
  }, 100);
};

export const logEvent = (action: string, category: string, label?: string, value?: number) => {
  initGA();
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value,
  });
};
