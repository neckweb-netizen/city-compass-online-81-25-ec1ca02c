declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Inicializa a tag nativa do Google Analytics injetando o script no Head
export const initGA = () => {
  if (document.getElementById('google-analytics-script')) return;

  const trackingId = "G-F7DPYTC96C";

  // Cria o elemento script da biblioteca gtag.js do Google
  const scriptAsync = document.createElement('script');
  scriptAsync.id = 'google-analytics-script';
  scriptAsync.async = true;
  scriptAsync.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
  document.head.appendChild(scriptAsync);

  // Inicializa o array de dados global
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  
  // Envia a configuração inicial desativando o pageview padrão automático para não duplicar
  window.gtag('config', trackingId, {
    send_page_view: false 
  });
};

// Captura detalhadamente as rotas, a URL completa e o título atualizado da página
export const logPageView = (path: string) => {
  if (window.gtag) {
    // Aguarda um milissegundo para garantir que o componente React já renderizou o novo <title>
    setTimeout(() => {
      window.gtag('config', 'G-F7DPYTC96C', {
        page_path: path,
        page_title: document.title || 'Página Sem Título',
        page_location: window.location.href
      });
      console.log(`[Google Analytics] PageView completo registrado: ${path} - Título: ${document.title}`);
    }, 100);
  }
};

// Função opcional para disparar eventos manuais (Cliques em botões, PWA, etc)
export const logEvent = (action: string, category: string, label?: string, value?: number) => {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
