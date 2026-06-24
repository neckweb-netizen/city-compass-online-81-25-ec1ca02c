
import { ReactNode, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock } from 'lucide-react';

interface RateLimitWrapperProps {
  children: ReactNode;
  maxRequests?: number;
  windowMs?: number;
  identifier?: string;
}

export const RateLimitWrapper = ({ 
  children, 
  maxRequests = 100, 
  windowMs = 60000,
  identifier = 'global'
}: RateLimitWrapperProps) => {
  const [requests, setRequests] = useState<number[]>([]);
  const [blocked, setBlocked] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<number>(0);
  const { toast } = useToast();

  const checkRateLimit = () => {
    const now = Date.now();
    const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      setBlocked(true);
      setBlockedUntil(now + windowMs);
      
      toast({
        title: "Limite de requisições",
        description: `Muitas requisições. Tente novamente em ${Math.ceil(windowMs / 1000)} segundos.`,
        variant: "destructive"
      });
      
      return false;
    }
    
    setRequests([...recentRequests, now]);
    return true;
  };

  useEffect(() => {
    if (blocked) {
      const timeout = setTimeout(() => {
        if (Date.now() >= blockedUntil) {
          setBlocked(false);
          setBlockedUntil(0);
        }
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [blocked, blockedUntil]);

  // Clean up old requests periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setRequests(prev => prev.filter(timestamp => now - timestamp < windowMs));
    }, windowMs);

    return () => clearInterval(cleanup);
  }, [windowMs]);

  if (blocked) {
    const remainingTime = Math.ceil((blockedUntil - Date.now()) / 1000);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Limite de Requisições Atingido</h3>
              <p className="text-sm text-muted-foreground">
                Muitas requisições foram feitas em um curto período.
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Tente novamente em {remainingTime} segundos</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div onClick={() => {
      if (!checkRateLimit()) {
        return;
      }
    }}>
      {children}
    </div>
  );
};
