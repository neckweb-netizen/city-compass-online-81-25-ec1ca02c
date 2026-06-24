
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAvisosSistema } from '@/hooks/useAvisosSistema';
import { Plus, Minus } from 'lucide-react';

interface AvisoSistemaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aviso?: any;
}

export const AvisoSistemaForm = ({ open, onOpenChange, aviso }: AvisoSistemaFormProps) => {
  const { criarAviso, atualizarAviso } = useAvisosSistema();
  
  const [formData, setFormData] = useState({
    titulo: aviso?.titulo || '',
    conteudo: aviso?.conteudo || '',
    tipo_aviso: aviso?.tipo_aviso || 'info',
    prioridade: aviso?.prioridade || 0,
    data_inicio: aviso?.data_inicio ? new Date(aviso.data_inicio).toISOString().slice(0, 16) : '',
    data_fim: aviso?.data_fim ? new Date(aviso.data_fim).toISOString().slice(0, 16) : '',
    botoes: aviso?.botoes || [{ texto: '', link: '', cor: 'primary' }]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dados = {
        ...formData,
        data_inicio: formData.data_inicio || undefined,
        data_fim: formData.data_fim || undefined,
        botoes: formData.botoes.filter(b => b.texto && b.link)
      };

      if (aviso) {
        await atualizarAviso({ id: aviso.id, ...dados });
      } else {
        await criarAviso(dados);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar aviso:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addBotao = () => {
    setFormData(prev => ({
      ...prev,
      botoes: [...prev.botoes, { texto: '', link: '', cor: 'primary' }]
    }));
  };

  const removeBotao = (index: number) => {
    setFormData(prev => ({
      ...prev,
      botoes: prev.botoes.filter((_, i) => i !== index)
    }));
  };

  const updateBotao = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      botoes: prev.botoes.map((botao, i) => 
        i === index ? { ...botao, [field]: value } : botao
      )
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {aviso ? 'Editar Aviso' : 'Novo Aviso do Sistema'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_aviso">Tipo</Label>
              <Select 
                value={formData.tipo_aviso} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_aviso: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Informação</SelectItem>
                  <SelectItem value="warning">Atenção</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="update">Atualização</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conteudo">Conteúdo</Label>
            <Textarea
              id="conteudo"
              value={formData.conteudo}
              onChange={(e) => setFormData(prev => ({ ...prev, conteudo: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Input
                id="prioridade"
                type="number"
                min="0"
                max="10"
                value={formData.prioridade}
                onChange={(e) => setFormData(prev => ({ ...prev, prioridade: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data Início</Label>
              <Input
                id="data_inicio"
                type="datetime-local"
                value={formData.data_inicio}
                onChange={(e) => setFormData(prev => ({ ...prev, data_inicio: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_fim">Data Fim</Label>
              <Input
                id="data_fim"
                type="datetime-local"
                value={formData.data_fim}
                onChange={(e) => setFormData(prev => ({ ...prev, data_fim: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Botões de Ação</Label>
              <Button type="button" onClick={addBotao} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Botão
              </Button>
            </div>

            {formData.botoes.map((botao, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-xs">Texto do Botão</Label>
                  <Input
                    placeholder="Ex: Saiba Mais"
                    value={botao.texto}
                    onChange={(e) => updateBotao(index, 'texto', e.target.value)}
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Link</Label>
                  <Input
                    placeholder="https://..."
                    value={botao.link}
                    onChange={(e) => updateBotao(index, 'link', e.target.value)}
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Cor</Label>
                  <Select 
                    value={botao.cor} 
                    onValueChange={(value) => updateBotao(index, 'cor', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primária</SelectItem>
                      <SelectItem value="secondary">Secundária</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.botoes.length > 1 && (
                  <div className="flex items-end">
                    <Button 
                      type="button" 
                      onClick={() => removeBotao(index)} 
                      size="sm" 
                      variant="destructive"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : aviso ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
