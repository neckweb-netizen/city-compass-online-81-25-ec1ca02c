
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Story {
  id: string;
  empresa_id: string | null;
  imagem_story_url: string;
  imagem_capa_url?: string | null;
  duracao: number;
  ordem: number;
  botao_titulo: string | null;
  botao_link: string | null;
  botao_tipo: string | null;
  nome_perfil_sistema?: string | null;
  empresas?: {
    id: string;
    nome: string;
    imagem_capa_url: string | null;
    slug: string;
  } | null;
}

interface StoryViewerProps {
  stories: Story[];
  currentIndex: number | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const StoryViewer = ({ 
  stories, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrev 
}: StoryViewerProps) => {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const currentStory = currentIndex !== null ? stories[currentIndex] : null;

  useEffect(() => {
    if (currentIndex === null || !currentStory) return;

    const duration = currentStory.duracao * 1000; // Convert to milliseconds
    const interval = 50; // Update every 50ms for smooth progress
    const increment = (interval / duration) * 100;

    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + increment;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          // Auto advance to next story
          setTimeout(() => {
            if (currentIndex < stories.length - 1) {
              onNext();
            } else {
              onClose();
            }
          }, 100);
          return 100;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(progressInterval);
  }, [currentIndex, currentStory, stories.length, onNext, onClose]);

  const handleButtonClick = () => {
    if (!currentStory) return;

    console.log('🔗 Story button clicked:', {
      botao_tipo: currentStory.botao_tipo,
      botao_link: currentStory.botao_link,
      empresa_id: currentStory.empresa_id,
      empresa_slug: currentStory.empresas?.slug
    });

    if (currentStory.botao_tipo === 'personalizado' && currentStory.botao_link) {
      // Open custom link in new tab
      console.log('🌐 Opening custom link:', currentStory.botao_link);
      window.open(currentStory.botao_link, '_blank');
    } else if (currentStory.empresas && currentStory.empresa_id) {
      // Navigate to company profile using slug preferentially, fallback to ID
      let profileUrl;
      
      if (currentStory.empresas.slug) {
        profileUrl = `/local/${currentStory.empresas.slug}`;
      } else {
        profileUrl = `/local/${currentStory.empresa_id}`;
      }
      
      console.log('📍 Navigating to company profile:', profileUrl);
      
      // Close the story viewer first
      onClose();
      
      // Navigate after a small delay to ensure the dialog closes
      setTimeout(() => {
        navigate(profileUrl);
      }, 100);
    }
  };

  const getButtonTitle = () => {
    return currentStory?.botao_titulo || 'Ver Perfil da Empresa';
  };

  if (!currentStory) return null;

  return (
    <Dialog open={currentIndex !== null} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-md w-full h-full max-h-[80vh] bg-black border-none">
        <DialogTitle className="sr-only">
          Story de {currentStory.empresas?.nome || currentStory.nome_perfil_sistema || 'Sistema'}
        </DialogTitle>
        
        <div className="relative w-full h-full">
          {/* Progress bars */}
          <div className="absolute top-2 left-2 right-2 z-10 flex gap-1">
            {stories.map((_, index) => (
              <div
                key={index}
                className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-75 ease-linear"
                  style={{
                    width: index < currentIndex 
                      ? '100%' 
                      : index === currentIndex 
                        ? `${progress}%` 
                        : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Story header */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8 border border-white">
                <AvatarImage 
                  src={currentStory.empresas?.imagem_capa_url || currentStory.imagem_capa_url || '/placeholder.svg'} 
                  alt={currentStory.empresas?.nome || currentStory.nome_perfil_sistema || 'Sistema'}
                />
                <AvatarFallback className="text-xs">
                  {(currentStory.empresas?.nome || currentStory.nome_perfil_sistema || 'Sistema').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-white text-sm font-medium">
                {currentStory.empresas?.nome || currentStory.nome_perfil_sistema || 'Sistema'}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 p-1 h-auto"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Story image */}
          <div className="relative w-full h-full">
            <img
              src={currentStory.imagem_story_url}
              alt="Story"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
            
            {/* Navigation areas */}
            <div className="absolute inset-0 flex">
              <div 
                className="flex-1 cursor-pointer"
                onClick={onPrev}
              />
              <div 
                className="flex-1 cursor-pointer"
                onClick={onNext}
              />
            </div>

            {/* Navigation arrows */}
            {currentIndex > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-1 h-auto"
                onClick={onPrev}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            )}
            
            {currentIndex < stories.length - 1 && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-1 h-auto"
                onClick={onNext}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            )}

            {/* Action button */}
            <div className="absolute bottom-4 left-4 right-4">
              <Button
                onClick={handleButtonClick}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 backdrop-blur-sm"
              >
                {getButtonTitle()}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
