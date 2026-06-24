import { useState } from 'react';
import { Share2, Copy, ExternalLink } from 'lucide-react';
import { Button } from './button';
import { useShortUrls } from '@/hooks/useShortUrls';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './dropdown-menu';
interface ShareButtonProps {
  url: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}
export const ShareButton = ({
  url,
  title = 'Confira isso!',
  description = '',
  variant = 'outline',
  size = 'sm',
  className
}: ShareButtonProps) => {
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const {
    createShortUrl,
    copyToClipboard,
    isLoading
  } = useShortUrls();
  const handleCreateShortUrl = async () => {
    if (shortUrl) {
      await copyToClipboard(shortUrl);
      return;
    }
    const result = await createShortUrl({
      original_url: url
    });
    if (result) {
      setShortUrl(result.short_url);
      await copyToClipboard(result.short_url);
    }
  };
  const handleCopyOriginal = async () => {
    await copyToClipboard(url);
  };
  const handleWhatsAppShare = async () => {
    const urlToShare = shortUrl || url;
    if (!shortUrl) {
      const result = await createShortUrl({
        original_url: url
      });
      if (result) {
        setShortUrl(result.short_url);
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title}\n\n${description}\n\n${result.short_url}`)}`;
        window.open(whatsappUrl, '_blank');
        return;
      }
    }
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title}\n\n${description}\n\n${urlToShare}`)}`;
    window.open(whatsappUrl, '_blank');
  };
  const handleTelegramShare = async () => {
    const urlToShare = shortUrl || url;
    if (!shortUrl) {
      const result = await createShortUrl({
        original_url: url
      });
      if (result) {
        setShortUrl(result.short_url);
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(result.short_url)}&text=${encodeURIComponent(`${title}\n\n${description}`)}`;
        window.open(telegramUrl, '_blank');
        return;
      }
    }
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(urlToShare)}&text=${encodeURIComponent(`${title}\n\n${description}`)}`;
    window.open(telegramUrl, '_blank');
  };
  const handleFacebookShare = async () => {
    const urlToShare = shortUrl || url;
    if (!shortUrl) {
      const result = await createShortUrl({
        original_url: url
      });
      if (result) {
        setShortUrl(result.short_url);
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(result.short_url)}`;
        window.open(facebookUrl, '_blank');
        return;
      }
    }
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlToShare)}`;
    window.open(facebookUrl, '_blank');
  };
  return <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={`group relative overflow-hidden transition-all duration-300 hover:scale-105 ${className}`} disabled={isLoading}>
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 transition-transform group-hover:rotate-12" />
            <span className="font-medium">Compartilhar</span>
          </div>
          {isLoading && <div className="absolute inset-0 bg-primary/20 animate-pulse rounded-md" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCreateShortUrl} disabled={isLoading}>
          <Copy className="h-4 w-4 mr-2" />
          {shortUrl ? 'Copiar URL Curta' : 'Criar URL Curta'}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleWhatsAppShare} disabled={isLoading}>
          <span className="text-green-600 font-medium mr-2">📱</span>
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTelegramShare} disabled={isLoading}>
          <span className="text-blue-500 font-medium mr-2">✈️</span>
          Telegram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFacebookShare} disabled={isLoading}>
          <span className="text-blue-600 font-medium mr-2">📘</span>
          Facebook
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>;
};