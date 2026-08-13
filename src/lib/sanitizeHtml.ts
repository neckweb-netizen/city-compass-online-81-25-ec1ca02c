const ALLOWED_TAGS = new Set([
  'a', 'div', 'span', 'p', 'br', 'strong', 'b', 'em', 'i', 'small',
  'ul', 'ol', 'li', 'img', 'picture', 'source', 'video', 'iframe',
]);

const ALLOWED_ATTRIBUTES = new Set([
  'alt', 'class', 'controls', 'height', 'href', 'loading', 'muted', 'playsinline',
  'poster', 'rel', 'src', 'srcset', 'target', 'title', 'type', 'width',
]);

const ALLOWED_IFRAME_HOSTS = new Set([
  'www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com',
]);

function isSafeUrl(value: string, tagName: string): boolean {
  if (value.startsWith('/') || value.startsWith('#')) return true;
  try {
    const url = new URL(value, window.location.origin);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    return tagName !== 'iframe' || ALLOWED_IFRAME_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function sanitizeHtml(html: string): string {
  if (!html || typeof window === 'undefined') return '';
  const documentNode = new DOMParser().parseFromString(html, 'text/html');

  for (const element of Array.from(documentNode.body.querySelectorAll('*'))) {
    const tagName = element.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith('on') || !ALLOWED_ATTRIBUTES.has(name)) {
        element.removeAttribute(attribute.name);
        continue;
      }
      if (['href', 'src', 'poster'].includes(name) && !isSafeUrl(attribute.value, tagName)) {
        element.removeAttribute(attribute.name);
      }
    }

    if (tagName === 'a') {
      element.setAttribute('rel', 'noopener noreferrer nofollow');
      if (element.getAttribute('target') !== '_blank') element.removeAttribute('target');
    }
    if (tagName === 'iframe') {
      element.setAttribute('loading', 'lazy');
      element.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      element.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
    }
  }

  return documentNode.body.innerHTML;
}
