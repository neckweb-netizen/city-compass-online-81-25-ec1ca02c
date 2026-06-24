
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Eye, EyeOff, Edit } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';

interface Story {
  id: string;
  empresa_id: string | null;
  tipo_story: 'empresa' | 'sistema';
  nome_perfil_sistema: string | null;
  tipo_midia: 'imagem' | 'video';
  url_midia: string;
  imagem_story_url: string;
  duracao: number;
  ordem: number;
  ativo: boolean;
  botao_titulo: string | null;
  botao_link: string | null;
  botao_tipo: string | null;
  empresas: {
    id: string;
    nome: string;
    imagem_capa_url: string | null;
    slug: string;
  } | null;
}

interface StoryManagementProps {
  stories: any[];
  onUpdateStory: (data: {
    id: string;
    imagem_story_url?: string;
    imagem_capa_url?: string;
    url_midia?: string;
    tipo_midia?: string;
    nome_perfil_sistema?: string;
    duracao?: number;
    ordem?: number;
    ativo?: boolean;
    botao_titulo?: string;
    botao_link?: string;
    botao_tipo?: string;
  }) => void;
  onDeleteStory: (id: string) => void;
}

export const StoryManagement = ({ stories, onUpdateStory, onDeleteStory }: StoryManagementProps) => {
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [editImage, setEditImage] = useState<string>('');
  const [editImagemCapa, setEditImagemCapa] = useState<string>('');
  const [editDuracao, setEditDuracao] = useState<number>(15);
  const [editOrdem, setEditOrdem] = useState<number>(0);
  const [editBotaoTitulo, setEditBotaoTitulo] = useState<string>('');
  const [editBotaoTipo, setEditBotaoTipo] = useState<string>('empresa');
  const [editBotaoLink, setEditBotaoLink] = useState<string>('');

  const handleEditClick = (story: Story) => {
    setEditingStory(story);
    setEditImage(story.imagem_story_url);
    setEditImagemCapa((story as any).imagem_capa_url || '');
    setEditDuracao(story.duracao);
    setEditOrdem(story.ordem);
    setEditBotaoTitulo(story.botao_titulo || 'Ver Perfil da Empresa');
    setEditBotaoTipo(story.botao_tipo || 'empresa');
    setEditBotaoLink(story.botao_link || '');
  };

  const handleSaveEdit = () => {
    if (!editingStory) return;

    const updateData: any = {
      id: editingStory.id,
      imagem_story_url: editImage,
      duracao: editDuracao,
      ordem: editOrdem,
      botao_titulo: editBotaoTitulo,
      botao_link: editBotaoTipo === 'personalizado' ? editBotaoLink : null,
      botao_tipo: editBotaoTipo,
    };

    // Incluir imagem de capa se fornecida
    if (editImagemCapa) {
      updateData.imagem_capa_url = editImagemCapa;
    }

    onUpdateStory(updateData);

    setEditingStory(null);
  };

  const handleToggleActive = (story: Story) => {
    onUpdateStory({
      id: story.id,
      ativo: !story.ativo,
    });
  };

  if (stories.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Nenhum story criado ainda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Stories Existentes</h3>
      
      <div className="grid gap-4">
        {stories.map((story) => (
          <Card key={story.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {story.tipo_story === 'sistema' 
                    ? `Story do Sistema - ${story.nome_perfil_sistema}`
                    : `Story de ${story.empresas?.nome || 'Empresa'}`
                  }
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={story.ativo ? 'default' : 'secondary'}>
                    {story.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Badge variant="outline">
                    Ordem: {story.ordem}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="relative w-full h-40 border rounded-lg overflow-hidden">
                    {story.tipo_midia === 'video' ? (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Vídeo</p>
                      </div>
                    ) : (
                      <img
                        src={story.url_midia || story.imagem_story_url}
                        alt="Story"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm">
                    <p><strong>Tipo:</strong> {story.tipo_story === 'sistema' ? 'Story do Sistema' : 'Story de Empresa'}</p>
                    <p><strong>Mídia:</strong> {story.tipo_midia === 'video' ? 'Vídeo' : 'Imagem'}</p>
                    <p><strong>Duração:</strong> {story.duracao}s</p>
                    <p><strong>Botão:</strong> {story.botao_titulo || 'Ver Perfil da Empresa'}</p>
                    <p><strong>Ação:</strong> {story.botao_tipo === 'personalizado' ? 'Link Personalizado' : story.botao_tipo === 'nenhum' ? 'Sem Botão' : 'Perfil da Empresa'}</p>
                    {story.botao_tipo === 'personalizado' && story.botao_link && (
                      <p><strong>Link:</strong> 
                        <a 
                          href={story.botao_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline ml-1 truncate max-w-[200px] inline-block"
                        >
                          {story.botao_link}
                        </a>
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={story.ativo}
                        onCheckedChange={() => handleToggleActive(story)}
                      />
                      <span className="text-sm">
                        {story.ativo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(story)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover Story</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover este story? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteStory(story.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para editar story */}
      <Dialog open={!!editingStory} onOpenChange={() => setEditingStory(null)}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Editar Story</DialogTitle>
          </DialogHeader>
          
          {editingStory && (
            <div className="flex-1 overflow-y-auto px-1">
              <div className="space-y-4 pb-4">
                <div>
                  <Label htmlFor="edit-story-image">Imagem do Story</Label>
                  <ImageUpload
                    value={editImage}
                    onChange={setEditImage}
                    bucket="imagens_empresas"
                    folder="stories"
                  />
                </div>

                {/* Campo de imagem de capa para stories do sistema */}
                <div>
                  <Label htmlFor="edit-story-capa">Imagem de Capa do Perfil</Label>
                  <ImageUpload
                    value={editImagemCapa}
                    onChange={setEditImagemCapa}
                    bucket="imagens_empresas"
                    folder="stories/capas"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-story-duration">Duração (segundos)</Label>
                    <Input
                      id="edit-story-duration"
                      type="number"
                      min="1"
                      max="15"
                      value={editDuracao}
                      onChange={(e) => setEditDuracao(Number(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-story-order">Ordem</Label>
                    <Input
                      id="edit-story-order"
                      type="number"
                      min="0"
                      value={editOrdem}
                      onChange={(e) => setEditOrdem(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-botao-titulo">Título do Botão</Label>
                  <Input
                    id="edit-botao-titulo"
                    value={editBotaoTitulo}
                    onChange={(e) => setEditBotaoTitulo(e.target.value)}
                    placeholder="Ver Perfil da Empresa"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-botao-tipo">Tipo do Botão</Label>
                  <Select value={editBotaoTipo} onValueChange={setEditBotaoTipo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empresa">Link para Perfil da Empresa</SelectItem>
                      <SelectItem value="personalizado">Link Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editBotaoTipo === 'personalizado' && (
                  <div>
                    <Label htmlFor="edit-botao-link">Link Personalizado</Label>
                    <Input
                      id="edit-botao-link"
                      value={editBotaoLink}
                      onChange={(e) => setEditBotaoLink(e.target.value)}
                      placeholder="https://exemplo.com"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t bg-background sticky bottom-0">
                <Button variant="outline" onClick={() => setEditingStory(null)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdit} className="w-full sm:w-auto">
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
