
import { CanalInformativoList } from '@/components/canal/CanalInformativoList';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

const CanalInformativo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const postId = searchParams.get('post');

  // Se houver um post específico na URL, rolar para ele
  useEffect(() => {
    if (postId) {
      // Aguardar um pouco para a página carregar completamente
      setTimeout(() => {
        const element = document.getElementById(`post-${postId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Destacar temporariamente o post
          element.classList.add('ring-2', 'ring-primary', 'ring-opacity-50');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary', 'ring-opacity-50');
          }, 3000);
        }
      }, 500);
    }
  }, [postId]);

  return (
    <div className="dark min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Modern Header with Gradient */}
      <div className="sticky top-0 z-40 tiktok-glass border-b border-border/20">
        <div className="w-full px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="action-button p-3 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-sm">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Canal Informativo
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                  ✨ Fique por dentro das novidades
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area with Modern Scroll */}
      <div className="w-full px-4 py-6 modern-scroll content-fade">
        <CanalInformativoList />
      </div>

      {/* Ambient Background Effect */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent/5 blur-3xl"></div>
      </div>
    </div>
  );
};

export default CanalInformativo;
