
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  GripVertical, 
  Eye, 
  EyeOff, 
  Home, 
  Search, 
  Image as ImageIcon,
  Grid3X3,
  Briefcase,
  Ticket,
  Radio,
  TrendingUp,
  Star,
  Calendar,
  BarChart3,
  ChevronUp,
  ChevronDown,
  Vote
} from "lucide-react";
import { useHomeSectionsOrder } from "@/hooks/useHomeSectionsOrder";
import { toast } from "sonner";

interface SectionIconMap {
  [key: string]: React.ComponentType<any>;
}

const sectionIcons: SectionIconMap = {
  banner: ImageIcon,
  search: Search,
  stories: ImageIcon,
  enquetes: Vote,
  categories: Grid3X3,
  latest_job_coupons: Briefcase,
  latest_coupons: Ticket,
  canal_informativo: Radio,
  popular_businesses: TrendingUp,
  featured_section: Star,
  eventos_slider: Calendar,
  stats_section: BarChart3,
  featured_products: Briefcase
};

export function AdminHomeSections() {
  const { sections, isLoading, toggleSectionVisibility, reorderSections } = useHomeSectionsOrder();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [localSections, setLocalSections] = useState(sections || []);

  // Atualizar o estado local quando as seções mudarem
  React.useEffect(() => {
    if (sections) {
      setLocalSections(sections);
    }
  }, [sections]);

  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    setDraggedItem(sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetSectionId) {
      setDraggedItem(null);
      return;
    }

    const draggedIndex = localSections.findIndex(s => s.id === draggedItem);
    const targetIndex = localSections.findIndex(s => s.id === targetSectionId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      return;
    }

    const newSections = [...localSections];
    const [removed] = newSections.splice(draggedIndex, 1);
    newSections.splice(targetIndex, 0, removed);

    setLocalSections(newSections);
    setDraggedItem(null);
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const currentIndex = localSections.findIndex(s => s.id === sectionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Verificar se o movimento é válido
    if (newIndex < 0 || newIndex >= localSections.length) return;

    const newSections = [...localSections];
    const [removed] = newSections.splice(currentIndex, 1);
    newSections.splice(newIndex, 0, removed);

    setLocalSections(newSections);
  };

  const handleSaveOrder = () => {
    reorderSections.mutate(localSections);
  };

  const handleToggleVisibility = (sectionId: string, currentValue: boolean) => {
    toggleSectionVisibility.mutate({ 
      sectionId, 
      ativo: !currentValue 
    });
  };

  const getSectionIcon = (sectionName: string) => {
    const IconComponent = sectionIcons[sectionName] || Home;
    return IconComponent;
  };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  const hasChanges = JSON.stringify(localSections.map(s => s.id)) !== JSON.stringify(sections?.map(s => s.id) || []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ordem das Seções</h1>
          <p className="text-muted-foreground">
            Gerencie a ordem e visibilidade das seções da página inicial
          </p>
        </div>
        
        {hasChanges && (
          <Button 
            onClick={handleSaveOrder}
            disabled={reorderSections.isPending}
          >
            {reorderSections.isPending ? 'Salvando...' : 'Salvar Ordem'}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {localSections.map((section, index) => {
          const IconComponent = getSectionIcon(section.section_name);
          const canMoveUp = index > 0;
          const canMoveDown = index < localSections.length - 1;
          
          return (
            <Card 
              key={section.id}
              className={`transition-all duration-200 ${
                draggedItem === section.id ? 'opacity-50 scale-95' : ''
              } ${
                section.ativo ? 'border-primary/20' : 'border-muted opacity-60'
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, section.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, section.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      
                      <div>
                        <CardTitle className="text-lg">{section.display_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {section.section_name}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Botões de ordenação para mobile */}
                    <div className="flex flex-col space-y-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveSection(section.id, 'up')}
                        disabled={!canMoveUp}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveSection(section.id, 'down')}
                        disabled={!canMoveDown}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>

                    <Badge variant="outline" className="font-mono">
                      #{index + 1}
                    </Badge>
                    
                    <div className="flex items-center space-x-2">
                      {section.ativo ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      
                      <Switch
                        checked={section.ativo}
                        onCheckedChange={(checked) => 
                          handleToggleVisibility(section.id, section.ativo)
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Status: {section.ativo ? 'Visível' : 'Oculta'}
                  </span>
                  <span>
                    Atualizada em: {new Date(section.atualizado_em).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {(!localSections || localSections.length === 0) && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Home className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma seção encontrada</h3>
              <p className="text-muted-foreground text-center">
                Não há seções configuradas para a página inicial.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
