
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { NeonCard } from '@/components/ui/neon-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEmpresaStories } from '@/hooks/useEmpresaStories';
import { StoryViewer } from './StoryViewer';

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

interface GroupedStory {
  empresa_id: string;
  empresa_nome: string;
  empresa_imagem: string | null;
  empresa_slug: string;
  stories: Story[];
  firstStoryIndex: number;
}

export const StoriesSection = () => {
  const { data: stories, isLoading } = useEmpresaStories();
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <section className="px-2 sm:px-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
              <div className="w-12 h-3 bg-muted rounded mt-1 mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!stories || stories.length === 0) {
    return null;
  }

  // Agrupar stories por empresa
  const groupedStories: GroupedStory[] = [];
  const empresaMap = new Map<string, GroupedStory>();

  stories.forEach((story, index) => {
    // Para stories do sistema, usar um ID especial
    const empresaId = story.empresa_id || `sistema-${story.id}`;
    
    if (!empresaMap.has(empresaId)) {
      const groupedStory: GroupedStory = {
        empresa_id: empresaId,
        empresa_nome: story.empresas?.nome || story.nome_perfil_sistema || 'Sistema',
        empresa_imagem: story.empresas?.imagem_capa_url || story.imagem_capa_url || null,
        empresa_slug: story.empresas?.slug || '',
        stories: [story],
        firstStoryIndex: index
      };
      empresaMap.set(empresaId, groupedStory);
      groupedStories.push(groupedStory);
    } else {
      empresaMap.get(empresaId)!.stories.push(story);
    }
  });

  const openStory = (groupedStory: GroupedStory) => {
    setSelectedStoryIndex(groupedStory.firstStoryIndex);
  };

  const closeStory = () => {
    setSelectedStoryIndex(null);
  };

  const nextStory = () => {
    if (selectedStoryIndex !== null && selectedStoryIndex < stories.length - 1) {
      setSelectedStoryIndex(selectedStoryIndex + 1);
    } else {
      closeStory();
    }
  };

  const prevStory = () => {
    if (selectedStoryIndex !== null && selectedStoryIndex > 0) {
      setSelectedStoryIndex(selectedStoryIndex - 1);
    }
  };

  return (
    <>
      <NeonCard className="mx-2 p-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {groupedStories.map((groupedStory) => (
            <div
              key={groupedStory.empresa_id}
              className="flex-shrink-0 cursor-pointer"
              onClick={() => openStory(groupedStory)}
            >
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-0.5">
                  <Avatar className="w-full h-full border-2 border-background">
                    <AvatarImage 
                      src={groupedStory.empresa_imagem || '/placeholder.svg'} 
                      alt={groupedStory.empresa_nome}
                      className="object-cover"
                      loading="lazy"
                      decoding="async"
                      width="64"
                      height="64"
                      sizes="64px"
                    />
                    <AvatarFallback className="text-xs">
                      {groupedStory.empresa_nome.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <p className="text-xs text-center mt-1 truncate w-14 sm:w-16">
                {groupedStory.empresa_nome}
              </p>
            </div>
          ))}
        </div>
      </NeonCard>

      <StoryViewer
        stories={stories}
        currentIndex={selectedStoryIndex}
        onClose={closeStory}
        onNext={nextStory}
        onPrev={prevStory}
      />
    </>
  );
};
