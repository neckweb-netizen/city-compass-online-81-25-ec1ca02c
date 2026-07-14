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
      <DialogContent className="p-0 w-screen h-screen max-w-none md:max-w-none bg-black border-none rounded-none flex items-center justify-center overflow-hidden [&>button]:hidden">
        <DialogTitle className="sr-only">
          Story de {currentStory.empresas?.nome || currentStory.nome_perfil_sistema || 'Sistema'}
        </DialogTitle>
        
        {/* Container principal flex vertical para estruturar no estilo do WhatsApp */}
        <div className="relative w-full h-full flex flex-col justify-between bg-black">
          
          {/* CABEÇALHO SUPERIOR UNIFICADO COM FUNDO ESCURO TRANSLÚCIDO PROTETOR */}
          <div className="w-full bg-black/80 backdrop-blur-md pt-4 pb-4 px-4 flex flex-col gap-3 z-30 border-b border-white/5 shrink-0">
            {/* Progress bars - Dentro do mesmo container para alinhamento vertical perfeito */}
            <div className="w-full flex gap-1">
              {stories.map((_, index) => (
                <div
                  key={index}
                  className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden"
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

            {/* Perfil e Botão X de Fechar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9 border border-white/30">
                  <AvatarImage 
                    src={currentStory.empresas?.imagem_capa_url || currentStory.imagem_capa_url || '/placeholder.svg'} 
                    alt={currentStory.empresas?.nome || currentStory.nome_perfil_sistema || 'Sistema'}
                  />
                  <AvatarFallback className="text-xs font-bold bg-purple-900 text-white">
                    {(currentStory.empresas?.nome || currentStory.nome_perfil_sistema || 'Sistema').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-white text-sm font-semibold tracking-wide">
                  {currentStory.empresas?.nome || currentStory.nome_perfil_sistema || 'Sistema'}
                </span>
              </div>

              {/* Botão de fechar (X) com fundo circular escuro, transparência protetora e bordas de contraste */}
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:text-gray-200 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/10 rounded-full w-9 h-9 flex items-center justify-center p-0 transition-colors"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* ÁREA CENTRAL DO STORY - Centralizada verticalmente e protegida das barras */}
          <div className="relative flex-1 w-full flex items-center justify-center bg-black overflow-hidden">
            <img
              src={currentStory.imagem_story_url}
              alt="Story"
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
            
            {/* Áreas invisíveis laterais de clique (Apenas cobrindo a mídia central para avançar/voltar) */}
            <div className="absolute inset-0 flex z-10">
              <div 
                className="flex-1 cursor-pointer"
                onClick={onPrev}
              />
              <div 
                className="flex-1 cursor-pointer"
                onClick={onNext}
              />
            </div>

            {/* Setas físicas para desktop (Sumindo na tela central para preservar contraste no celular) */}
            {currentIndex > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 h-auto z-20 hidden md:flex"
                onClick={onPrev}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            )}
            
            {currentIndex < stories.length - 1 && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2 h-auto z-20 hidden md:flex"
                onClick={onNext}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            )}
          </div>

          {/* RODAPÉ E BOTÃO DE AÇÃO */}
          <div className="w-full pb-10 pt-4 px-4 bg-gradient-to-t from-black to-transparent z-20 shrink-0">
            <Button
              onClick={handleButtonClick}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm py-6 rounded-xl shadow-xl transition-all duration-200 active:scale-[0.98]"
            >
              {getButtonTitle()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
