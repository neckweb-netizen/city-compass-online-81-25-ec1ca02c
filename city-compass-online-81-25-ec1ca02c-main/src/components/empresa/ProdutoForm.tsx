
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCriarProduto, useAtualizarProduto, type ProdutoInput } from '@/hooks/useProdutos';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/ui/image-upload';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

const produtoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  preco_original: z.number().min(0.01, 'Preço deve ser maior que zero'),
  preco_promocional: z.number().optional(),
  categoria_produto: z.string().optional(),
  imagem_principal_url: z.string().optional(),
  galeria_imagens: z.array(z.string()).optional(),
  ativo: z.boolean().default(true),
  destaque: z.boolean().default(false),
  estoque_disponivel: z.number().optional(),
  codigo_produto: z.string().optional(),
  tags: z.array(z.string()).optional(),
  link_compra: z.string().optional(),
  link_whatsapp: z.string().optional(),
}).refine(
  (data) => {
    if (data.preco_promocional && data.preco_promocional >= data.preco_original) {
      return false;
    }
    return true;
  },
  {
    message: 'Preço promocional deve ser menor que o preço original',
    path: ['preco_promocional'],
  }
).refine(
  (data) => {
    if (data.link_whatsapp && !data.link_whatsapp.startsWith('https://wa.me/') && !data.link_whatsapp.startsWith('https://api.whatsapp.com/')) {
      return false;
    }
    return true;
  },
  {
    message: 'Link do WhatsApp deve começar com https://wa.me/ ou https://api.whatsapp.com/',
    path: ['link_whatsapp'],
  }
);

interface ProdutoFormProps {
  empresaId: string;
  produto?: any;
  onClose: () => void;
}

export const ProdutoForm = ({ empresaId, produto, onClose }: ProdutoFormProps) => {
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(produto?.tags || []);

  const criarProduto = useCriarProduto();
  const atualizarProduto = useAtualizarProduto();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProdutoInput>({
    resolver: zodResolver(produtoSchema),
    defaultValues: produto || {
      nome: '',
      descricao: '',
      preco_original: 0,
      preco_promocional: undefined,
      categoria_produto: '',
      imagem_principal_url: '',
      galeria_imagens: [],
      ativo: true,
      destaque: false,
      estoque_disponivel: 0,
      codigo_produto: '',
      tags: [],
      link_compra: '',
      link_whatsapp: '',
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: ProdutoInput) => {
    try {
      const produtoData = {
        ...data,
        tags: tags,
        empresa_id: empresaId,
      };

      if (produto) {
        await atualizarProduto.mutateAsync({
          id: produto.id,
          ...produtoData,
        });
      } else {
        await criarProduto.mutateAsync(produtoData);
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    setValue('tags', newTags);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {produto ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome do Produto *</Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Digite o nome do produto"
              />
              {errors.nome && (
                <p className="text-red-500 text-sm">{errors.nome.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="codigo_produto">Código do Produto</Label>
              <Input
                id="codigo_produto"
                {...register('codigo_produto')}
                placeholder="Ex: COD001"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              {...register('descricao')}
              placeholder="Descreva o produto..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preco_original">Preço Original *</Label>
              <Input
                id="preco_original"
                type="number"
                step="0.01"
                {...register('preco_original', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.preco_original && (
                <p className="text-red-500 text-sm">{errors.preco_original.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="preco_promocional">Preço Promocional</Label>
              <Input
                id="preco_promocional"
                type="number"
                step="0.01"
                {...register('preco_promocional', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.preco_promocional && (
                <p className="text-red-500 text-sm">{errors.preco_promocional.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="categoria_produto">Categoria</Label>
              <Input
                id="categoria_produto"
                {...register('categoria_produto')}
                placeholder="Ex: Eletrônicos, Roupas..."
              />
            </div>

            <div>
              <Label htmlFor="estoque_disponivel">Estoque Disponível</Label>
              <Input
                id="estoque_disponivel"
                type="number"
                {...register('estoque_disponivel', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite uma tag e pressione Enter"
              />
              <Button type="button" onClick={addTag}>
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="link_compra">Link de Compra</Label>
              <Input
                id="link_compra"
                {...register('link_compra')}
                placeholder="https://exemplo.com/produto"
                type="url"
              />
              {errors.link_compra && (
                <p className="text-red-500 text-sm">{errors.link_compra.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Opcional: Link direto para a página de compra do produto
              </p>
            </div>

            <div>
              <Label htmlFor="link_whatsapp">Link do WhatsApp</Label>
              <Input
                id="link_whatsapp"
                {...register('link_whatsapp')}
                placeholder="https://wa.me/5511999999999"
                type="url"
              />
              {errors.link_whatsapp && (
                <p className="text-red-500 text-sm">{errors.link_whatsapp.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Opcional: Link para contato via WhatsApp sobre o produto
              </p>
            </div>
          </div>

          <div>
            <Label>Imagem Principal</Label>
            <ImageUpload
              value={watchedValues.imagem_principal_url}
              onChange={(url) => setValue('imagem_principal_url', url)}
              bucket="imagens_empresas"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={watchedValues.ativo}
                onCheckedChange={(checked) => setValue('ativo', checked)}
              />
              <Label htmlFor="ativo">Produto Ativo</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="destaque"
                checked={watchedValues.destaque}
                onCheckedChange={(checked) => setValue('destaque', checked)}
              />
              <Label htmlFor="destaque">Produto em Destaque</Label>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={criarProduto.isPending || atualizarProduto.isPending}
            >
              {produto ? 'Atualizar' : 'Criar'} Produto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
