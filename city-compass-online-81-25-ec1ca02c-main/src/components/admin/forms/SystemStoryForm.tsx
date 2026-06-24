import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ImageUpload } from '@/components/ui/image-upload';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';

interface SystemStoryFormProps {
  onCreateStory: (data: {
    tipo_story: 'sistema';
    nome_perfil_sistema: string;
    tipo_midia: 'imagem' | 'video';
    url_midia: string;
    imagem_capa_url: string;
    duracao: number;
    ordem?: number;
    botao_titulo?: string;
    botao_link?: string;
    botao_tipo?: string;
  }) => void;
}

export const SystemStoryForm = ({ onCreateStory }: SystemStoryFormProps) => {
  const [open, setOpen] = useState(false);
  const [nomePerfilSistema, setNomePerfilSistema] = useState('');
  const [tipoMidia, setTipoMidia] = useState<'imagem' | 'video'>('imagem');
  const [urlMidia, setUrlMidia] = useState('');
  const [imagemCapaUrl, setImagemCapaUrl] = useState('');
  const [duracao, setDuracao] = useState<number>(15);
  const [ordem, setOrdem] = useState<number>(0);
  const [botaoTitulo, setBotaoTitulo] = useState<string>('Saiba Mais');
  const [botaoTipo, setBotaoTipo] = useState<string>('personalizado');
  const [botaoLink, setBotaoLink] = useState<string>('');

  const handleSubmit = () => {
    if (!nomePerfilSistema.trim() || !urlMidia.trim() || !imagemCapaUrl.trim()) {
      return;
    }

    onCreateStory({
      tipo_story: 'sistema',
      nome_perfil_sistema: nomePerfilSistema,
      tipo_midia: tipoMidia,
      url_midia: urlMidia,
      imagem_capa_url: imagemCapaUrl,
      duracao,
      ordem,
      botao_titulo: botaoTitulo,
      botao_link: botaoTipo === 'personalizado' ? botaoLink : null,
      botao_tipo: botaoTipo,
    });

    // Reset form
    setNomePerfilSistema('');
    setUrlMidia('');
    setImagemCapaUrl('');
    setDuracao(15);
    setOrdem(0);
    setBotaoTitulo('Saiba Mais');
    setBotaoTipo('personalizado');
    setBotaoLink('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Plus className="w-4 h-4 mr-1" />
          Criar Story do Sistema
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Story do Sistema</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="nome-perfil">Nome do Perfil</Label>
            <Input
              id="nome-perfil"
              value={nomePerfilSistema}
              onChange={(e) => setNomePerfilSistema(e.target.value)}
              placeholder="Ex: Prefeitura de São José, Radar SAJ..."
            />
          </div>

          <div>
            <Label htmlFor="imagem-capa">Imagem de Capa do Perfil</Label>
            <ImageUpload
              value={imagemCapaUrl}
              onChange={setImagemCapaUrl}
              bucket="imagens_empresas"
              folder="stories/capas"
            />
          </div>

          <div>
            <Label htmlFor="tipo-midia">Tipo de Mídia</Label>
            <Select value={tipoMidia} onValueChange={(value: 'imagem' | 'video') => setTipoMidia(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="imagem">Imagem</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="story-media">
              {tipoMidia === 'imagem' ? 'Imagem do Story' : 'URL do Vídeo'}
            </Label>
            {tipoMidia === 'imagem' ? (
              <ImageUpload
                value={urlMidia}
                onChange={setUrlMidia}
                bucket="imagens_empresas"
                folder="stories"
              />
            ) : (
              <div className="space-y-2">
                <Input
                  id="story-media"
                  value={urlMidia}
                  onChange={(e) => setUrlMidia(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... ou URL direta do vídeo"
                />
                <p className="text-sm text-muted-foreground">
                  Suporta URLs do YouTube, Vimeo ou links diretos para arquivos de vídeo
                </p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="story-duration">Duração (segundos)</Label>
              <Input
                id="story-duration"
                type="number"
                min="1"
                max="30"
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
              placeholder="Saiba Mais"
            />
          </div>

          <div>
            <Label htmlFor="botao-tipo">Tipo do Botão</Label>
            <Select value={botaoTipo} onValueChange={setBotaoTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personalizado">Link Personalizado</SelectItem>
                <SelectItem value="nenhum">Sem Botão</SelectItem>
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
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!nomePerfilSistema.trim() || !urlMidia.trim() || !imagemCapaUrl.trim()}
            >
              Criar Story
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};