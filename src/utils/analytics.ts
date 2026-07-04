declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const initGA = () => {
  if (document.getElementById('google-analytics-script')) return;

  const trackingId = "G-F7DPYTC96C";

  const scriptAsync = document.createElement('script');
  scriptAsync.id = 'google-analytics-script';
  scriptAsync.async = true;
  scriptAsync.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
  document.head.appendChild(scriptAsync);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', trackingId, {
    send_page_view: false 
  });
};

export const logPageView = (path: string) => {
  if (window.gtag) {
    window.gtag('config', 'G-F7DPYTC96C', {
      page_path: path,
    });
    console.log(`[Analytics] PageView registrado: ${path}`);
  }
};

export const logEvent = (action: string, category: string, label?: string, value?: number) => {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
