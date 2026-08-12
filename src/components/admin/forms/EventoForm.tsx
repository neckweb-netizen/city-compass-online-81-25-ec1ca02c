import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Plus, Calendar, Clock, Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCategorias } from '@/hooks/useCategorias';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useMinhaEmpresa } from '@/hooks/useMinhaEmpresa';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { usePlanoLimites } from '@/hooks/usePlanoLimites';
import { cn } from '@/lib/utils';
import { uploadParaR2 } from '@/lib/r2';

const eventoSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  data_evento: z.date({
    required_error: 'Data do evento é obrigatória',
  }),
  horario_inicio: z.string().min(1, 'Horário de início é obrigatório'),
  horario_fim: z.string().optional(),
  local: z.string().optional(),
  endereco: z.string().optional(),
  categoria_id: z.string().uuid('Selecione uma categoria').optional(),
  empresa_id: z.string().uuid('Selecione uma empresa').optional(),
  imagem_banner: z.string().optional(),
});

type EventoFormData = z.infer<typeof eventoSchema>;

interface EventoFormProps {
  onSuccess?: () => void;
  empresaId?: string;
}

export const EventoForm = ({ onSuccess, empresaId }: EventoFormProps) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { data: categorias } = useCategorias();
  const { empresa } = useMinhaEmpresa();
  const { verificarLimiteEventos } = usePlanoLimites();

  const form = useForm<EventoFormData>({
    resolver: zodResolver(eventoSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      horario_inicio: '',
      horario_fim: '',
      local: '',
      endereco: '',
      categoria_id: '',
      empresa_id: '',
      imagem_banner: '',
    },
  });

  useEffect(() => {
    const targetEmpresaId = empresaId || empresa?.id;
    if (targetEmpresaId && !form.getValues('empresa_id')) {
      form.setValue('empresa_id', targetEmpresaId);
    }
  }, [empresa, empresaId, form]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, onChange: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadParaR2(file, 'eventos');
      onChange(url);
      toast({ title: 'Imagem enviada com sucesso!' });
    } catch (error: any) {
      toast({
        title: 'Erro no envio da imagem',
        description: error.message || 'Falha ao enviar imagem para o Cloudflare R2.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: EventoFormData) => {
    try {
      const podecriar = await verificarLimiteEventos();
      if (!podecriar) return;

      const cidadeId = profile?.cidade_id || empresa?.cidade_id;
      
      if (!cidadeId) {
        toast({
          title: 'Erro',
          description: 'Você precisa ter uma cidade associada ao seu perfil ou empresa para criar eventos.',
          variant: 'destructive'
        });
        return;
      }

      const dataInicio = new Date(data.data_evento);
      const [horaInicio, minutoInicio] = data.horario_inicio.split(':');
      dataInicio.setHours(parseInt(horaInicio), parseInt(minutoInicio));

      let dataFim = null;
      if (data.horario_fim) {
        dataFim = new Date(data.data_evento);
        const [horaFim, minutoFim] = data.horario_fim.split(':');
        dataFim.setHours(parseInt(horaFim), parseInt(minutoFim));
      }

      const eventoData = {
        titulo: data.titulo,
        descricao: data.descricao || null,
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim ? dataFim.toISOString() : null,
        local: data.local || null,
        endereco: data.endereco || null,
        categoria_id: data.categoria_id || null,
        empresa_id: data.empresa_id || empresaId || empresa?.id || null,
        imagem_banner: data.imagem_banner || null,
        cidade_id: cidadeId,
        hora_fim: data.horario_fim || null,
      };

      const { error } = await supabase
        .from('eventos')
        .insert(eventoData);

      if (error) throw error;

      toast({ title: 'Evento criado com sucesso! Aguardando aprovação.' });
      
      queryClient.invalidateQueries({ queryKey: ['empresa-eventos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-eventos'] });
      queryClient.invalidateQueries({ queryKey: ['eventos'] });
      
      form.reset();
      if (!empresaId) {
        setOpen(false);
      }
      onSuccess?.();
    } catch (error) {
      toast({ 
        title: 'Erro ao criar evento', 
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive' 
      });
    }
  };

  const renderFormContent = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título do Evento</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Festival de Música, Feira de Artesanato..." {...field} />
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
                <Textarea 
                  placeholder="Descreva o evento, atrações, programação..."
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="data_evento"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data do Evento</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Clock className="w-4 h-4" />
            <span>Horários do Evento</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
            <FormField
              control={form.control}
              name="horario_inicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Início do evento *</FormLabel>
                  <FormControl>
                    <Input 
                      type="time" 
                      {...field} 
                      className="w-full text-center text-lg font-mono"
                      placeholder="09:00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="horario_fim"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Fim do evento (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="time" 
                      {...field} 
                      className="w-full text-center text-lg font-mono"
                      placeholder="18:00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="local"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Local do Evento</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Centro de Convenções, Praça Central..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endereco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Rua, número, bairro..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="categoria_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria (opcional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categorias?.filter(c => c.ativo && c.tipo === 'evento').map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imagem_banner"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagem do Evento (Cloudflare R2)</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  {field.value ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                      <img src={field.value} alt="Banner do Evento" className="w-full h-full object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => field.onChange('')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploading ? (
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Clique para enviar a imagem do evento</p>
                            <p className="text-xs text-muted-foreground">Compressão automática para WebP via R2</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => handleImageUpload(e, field.onChange)}
                      />
                    </label>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4 border-t">
          {!empresaId && (
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={uploading}>
            Criar Evento
          </Button>
        </div>
      </form>
    </Form>
  );

  if (empresaId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Criar Novo Evento</h2>
        </div>
        {renderFormContent()}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Evento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Criar Novo Evento
          </DialogTitle>
        </DialogHeader>
        {renderFormContent()}
      </DialogContent>
    </Dialog>
  );
};
