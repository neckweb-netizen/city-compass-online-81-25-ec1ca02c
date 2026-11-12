import { cn } from '@/lib/utils';

interface GoogleMapsAttributionProps {
  imageUrl?: string | null;
  className?: string;
}

export function GoogleMapsAttribution({ imageUrl, className }: GoogleMapsAttributionProps) {
  if (!imageUrl?.includes('/functions/v1/google-place-photo?')) return null;

  let placeId = '';
  try {
    placeId = new URL(imageUrl).searchParams.get('place_id') || '';
  } catch {
    return null;
  }

  const sourceUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeId)}&query_place_id=${encodeURIComponent(placeId)}`;

  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noreferrer"
      translate="no"
      aria-label="Ver fonte da imagem no Google Maps"
      onClick={(event) => event.stopPropagation()}
      className={cn(
        'absolute bottom-1 left-1 z-20 inline-flex min-h-11 items-center rounded-lg bg-black/75 px-3 py-1 font-sans text-xs font-medium tracking-normal text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
        className,
      )}
    >
      Google Maps
    </a>
  );
}
