// Utilities for performance optimization

// Preload critical resources
export const preloadCriticalResources = () => {
  // Preload fonts and other critical resources
  const preloadLink = (href: string, as: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  };

  // Preload common images and icons
  const commonAssets = [
    '/favicon.ico',
    '/placeholder.svg'
  ];

  commonAssets.forEach(asset => {
    const img = new Image();
    img.src = asset;
  });
};

// Optimize images loading
export const optimizeImageLoading = () => {
  // Add lazy loading to all images
  const images = document.querySelectorAll('img:not([loading])');
  images.forEach(img => {
    img.setAttribute('loading', 'lazy');
  });
};

// Request idle callback for non-critical tasks
export const runOnIdle = (callback: () => void) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback);
  } else {
    setTimeout(callback, 1);
  }
};

// Debounce function for performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for performance
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Initialize performance optimizations
export const initPerformanceOptimizations = () => {
  // Run optimizations on idle
  runOnIdle(() => {
    preloadCriticalResources();
    optimizeImageLoading();
  });

  // Optimize scroll performance
  let scrolling = false;
  const handleScroll = throttle(() => {
    if (!scrolling) {
      requestAnimationFrame(() => {
        // Handle scroll-related updates here
        scrolling = false;
      });
      scrolling = true;
    }
  }, 16); // ~60fps

  window.addEventListener('scroll', handleScroll, { passive: true });
};