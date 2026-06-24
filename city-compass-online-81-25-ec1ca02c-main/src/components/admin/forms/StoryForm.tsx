
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/ui/image-upload';
import { Camera } from 'lucide-react';

interface StoryFormProps {
  empresaId: string;
  empresaNome: string;
  empresaImagemCapa?: string | null;
  onCreateStory: (data: {
    empresa_id?: string | null;
    tipo_story: 'empresa' | 'sistema';
    nome_perfil_sistema?: string;
    tipo_midia?: 'imagem' | 'video';
    url_midia: string;
    imagem_story_url?: string;
    duracao: number;
    ordem?: number;
    botao_titulo?: string;
    botao_link?: string;
    botao_tipo?: string;
  }) => void;
}

export const StoryForm = ({ 
  empresaId, 
  empresaNome, 
  empresaImagemCapa, 
  onCreateStory 
}: StoryFormProps) => {
  const [open, setOpen] = useState(false);
  const [storyImage, setStoryImage] = useState<string>('');
  const [duracao, setDuracao] = useState<number>(15);
  const [ordem, setOrdem] = useState<number>(0);
  const [botaoTitulo, setBotaoTitulo] = useState<string>('Ver Perfil da Empresa');
  const [botaoTipo, setBotaoTipo] = useState<string>('empresa');
  const [botaoLink, setBotaoLink] = useState<string>('');

  const handleSubmit = () => {
    if (!storyImage && !empresaImagemCapa) {
      console.error('Nenhuma imagem disponível para o story');
      return;
    }

    const imagemStory = storyImage || empresaImagemCapa || '';

    onCreateStory({
      empresa_id: empresaId,
      tipo_story: 'empresa',
      tipo_midia: 'imagem',
      url_midia: imagemStory,
      imagem_story_url: imagemStory,
      duracao,
      ordem,
      botao_titulo: botaoTitulo,
      botao_link: botaoTipo === 'personalizado' ? botaoLink : null,
      botao_tipo: botaoTipo,
    });

    // Reset form
    setStoryImage('');
    setDuracao(15);
    setOrdem(0);
    setBotaoTitulo('Ver Perfil da Empresa');
    setBotaoTipo('empresa');
    setBotaoLink('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Camera className="w-4 h-4 mr-1" />
          Adicionar Story
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Criar Story para {empresaNome}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-1">
          <div className="space-y-4 pb-4">
            <div>
              <Label htmlFor="story-image">Imagem do Story</Label>
              <p className="text-sm text-muted-foreground mb-2">
                {storyImage ? 'Imagem personalizada selecionada' : 'Se não escolher uma imagem, será usada a imagem de capa da empresa'}
              </p>
              <ImageUpload
                value={storyImage}
                onChange={setStoryImage}
                bucket="imagens_empresas"
                folder="stories"
              />
              {!storyImage && empresaImagemCapa && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">Preview da imagem padrão:</p>
                  <div className="mt-1 relative w-full h-32 border rounded-lg overflow-hidden">
                    <img
                      src={empresaImagemCapa}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="story-duration">Duração (segundos)</Label>
                <Input
                  id="story-duration"
                  type="number"
                  min="1"
                  max="15"
                  value={duracao}
                  onChange={(e) => setDuracao(Number(e.target.value))}
                />
              </div>
              
              <div>
                <Label htmlFor="story-order">Ordem</Label>
                <Input
                  id="story-order"
                  type="number"
                  min="0"
                  value={ordem}
                  onChange={(e) => setOrdem(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="botao-titulo">Título do Botão</Label>
              <Input
                id="botao-titulo"
                value={botaoTitulo}
                onChange={(e) => setBotaoTitulo(e.target.value)}
                placeholder="Ver Perfil da Empresa"
              />
            </div>

            <div>
              <Label htmlFor="botao-tipo">Tipo do Botão</Label>
              <Select value={botaoTipo} onValueChange={setBotaoTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empresa">Link para Perfil da Empresa</SelectItem>
                  <SelectItem value="personalizado">Link Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {botaoTipo === 'personalizado' && (
              <div>
                <Label htmlFor="botao-link">Link Personalizado</Label>
                <Input
                  id="botao-link"
                  value={botaoLink}
                  onChange={(e) => setBotaoLink(e.target.value)}
                  placeholder="https://exemplo.com"
                />
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t bg-background sticky bottom-0">
            <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!storyImage && !empresaImagemCapa}
              className="w-full sm:w-auto"
            >
              Criar Story
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
