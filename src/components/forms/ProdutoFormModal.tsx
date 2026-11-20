
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v3';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Package } from 'lucide-react';
import { usePlanoLimites } from '@/hooks/usePlanoLimites';

const produtoSchema = z.object({
  nome: z.string().trim().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  preco_original: z.number().min(0.01, 'Preço deve ser maior que 0'),
  preco_promocional: z.number().positive('Preço promocional deve ser maior que zero').optional(),
  categoria_produto: z.string().optional(),
  codigo_produto: z.string().optional(),
  estoque_disponivel: z.number().int('Estoque deve ser inteiro').min(0, 'Estoque não pode ser negativo').optional(),
  empresa_id: z.string().uuid('Selecione uma empresa'),
  imagem_principal_url: z.string().url('URL inválida').optional().or(z.literal('')),
}).refine(data => data.preco_promocional === undefined || data.preco_promocional < data.preco_original, { message: 'Preço promocional deve ser menor que o original', path: ['preco_promocional'] });

type ProdutoFormData = z.infer<typeof produtoSchema>;

interface ProdutoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProdutoFormModal = ({ open, onOpenChange }: ProdutoFormModalProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { verificarLimiteProdutos } = usePlanoLimites();

  // Buscar empresas do usuário logado
  const { data: empresas, isLoading: empresasLoading, isError: empresasError, refetch: refetchEmpresas } = useQuery({
    queryKey: ['user-empresas-produto', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome')
        .eq('usuario_id', user?.id)
        .eq('ativo', true)
        .eq('status_aprovacao', 'aprovado')
        .order('nome');

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      estoque_disponivel: 0,
    },
  });

  const onSubmit = async (data: ProdutoFormData) => {
    if (submittingRef.current) return;
    if (empresasLoading || empresasError || !empresas?.some(e => e.id === data.empresa_id)) {
      toast({ title: 'Empresa indisponível', description: 'Selecione uma empresa aprovada e tente novamente.', variant: 'destructive' });
      return;
    }
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      // Verificar limite do plano antes de criar novo produto
      const podeCriar = await verificarLimiteProdutos();
      if (!podeCriar) {
        return;
      }

      const { error } = await supabase
        .from('produtos')
        .insert({
          nome: data.nome,
          descricao: data.descricao || null,
          preco_original: data.preco_original,
          preco_promocional: data.preco_promocional || null,
          categoria_produto: data.categoria_produto || null,
          codigo_produto: data.codigo_produto || null,
          estoque_disponivel: data.estoque_disponivel || 0,
          empresa_id: data.empresa_id,
          imagem_principal_url: data.imagem_principal_url || null,
        });

      if (error) throw error;

      void queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast({ title: 'Produto criado com sucesso!' });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      toast({ 
        title: 'Erro ao criar produto', 
        description: 'Tente novamente.',
        variant: 'destructive' 
      });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && submittingRef.current) return; onOpenChange(nextOpen); }}>
      <DialogContent className="w-[95vw] max-w-[600px] h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Criar Novo Produto
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do produto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição do produto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preco_original"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Original</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="29.90"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preco_promocional"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Promocional (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="24.90"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoria_produto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Roupas, Eletrônicos, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codigo_produto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código do Produto (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="SKU123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="estoque_disponivel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estoque Disponível</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="100"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="empresa_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={empresasLoading || empresasError}>
                    <FormControl>
                      <SelectTrigger aria-label="Empresa responsável pelo produto">
                        <SelectValue placeholder={empresasLoading ? 'Carregando empresas...' : 'Selecione uma empresa'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {empresas?.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.id}>
                          {empresa.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {empresasError && <div role="alert" className="space-y-2 text-sm"><p>Não foi possível consultar suas empresas.</p><Button type="button" variant="outline" onClick={() => { void refetchEmpresas(); }}>Tentar novamente</Button></div>}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imagem_principal_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imagem Principal (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://exemplo.com/produto.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        </div>
        
        {/* Botões fixos na parte inferior */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting || empresasLoading || empresasError || !empresas?.length} aria-busy={isSubmitting} onClick={form.handleSubmit(onSubmit)}>
            Criar Produto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
