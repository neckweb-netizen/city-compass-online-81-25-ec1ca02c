import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Plus, Calendar, Clock } from 'lucide-react';
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
import { ImageUpload } from '@/components/ui/image-upload';
import { usePlanoLimites } from '@/hooks/usePlanoLimites';
import { cn } from '@/lib/utils';

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
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { data: categorias } = useCategorias();
  const { empresa } = useMinhaEmpresa();
  const { verificarLimiteEventos } = usePlanoLimites();

  console.log('🔍 EventoForm - Debug info:', {
    user: user?.id,
    profile: profile?.id,
    profileCidade: profile?.cidade_id,
    empresa: empresa?.id,
    empresaCidade: empresa?.cidade_id,
    empresaIdProp: empresaId
  });

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

  // Definir empresa_id automaticamente se o usuário tem uma empresa ou se empresaId foi passado
  useEffect(() => {
    const targetEmpresaId = empresaId || empresa?.id;
    if (targetEmpresaId && !form.getValues('empresa_id')) {
      console.log('🏢 Definindo empresa_id automaticamente:', targetEmpresaId);
      form.setValue('empresa_id', targetEmpresaId);
    }
  }, [empresa, empresaId, form]);

  const onSubmit = async (data: EventoFormData) => {
    try {
      console.log('📝 Iniciando criação de evento:', data);

      // Verificar limite do plano antes de criar evento
      const podecriar = await verificarLimiteEventos();
      if (!podecriar) {
        return;
      }

      // Verificar se temos cidade_id (do perfil ou da empresa)
      const cidadeId = profile?.cidade_id || empresa?.cidade_id;
      
      if (!cidadeId) {
        console.error('❌ Cidade não encontrada no perfil ou empresa');
        toast({
          title: 'Erro',
          description: 'Você precisa ter uma cidade associada ao seu perfil ou empresa para criar eventos.',
          variant: 'destructive'
        });
        return;
      }

      // Combinar data e horário
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

      console.log('📤 Enviando dados do evento:', eventoData);

      const { error } = await supabase
        .from('eventos')
        .insert(eventoData);

      if (error) {
        console.error('❌ Erro ao inserir evento:', error);
        throw error;
      }

      console.log('✅ Evento criado com sucesso!');
      toast({ title: 'Evento criado com sucesso! Aguardando aprovação.' });
      
      // Invalidar as queries relacionadas a eventos
      queryClient.invalidateQueries({ queryKey: ['empresa-eventos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-eventos'] });
      queryClient.invalidateQueries({ queryKey: ['eventos'] });
      
      form.reset();
      if (!empresaId) {
        setOpen(false);
      }
      onSuccess?.();
    } catch (error) {
      console.error('💥 Erro ao criar evento:', error);
      toast({ 
        title: 'Erro ao criar evento', 
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive' 
      });
    }
  };

  // Se empresaId foi passado, renderizar apenas o formulário (sem dialog)
  if (empresaId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Criar Novo Evento</h2>
        </div>
        
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
                      <FormLabel className="text-sm font-medium">
                        Início do evento *
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="time" 
                            {...field} 
                            className="w-full text-center text-lg font-mono"
                            placeholder="09:00"
                          />
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Horário obrigatório para início
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horario_fim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Fim do evento (opcional)
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="time" 
                            {...field} 
                            className="w-full text-center text-lg font-mono"
                            placeholder="18:00"
                          />
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Deixe vazio se não souber quando termina
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <div className="text-xs text-blue-700">
                  <strong>Dica:</strong> Use horários no formato 24h (exemplo: 14:30 para 2:30 da tarde). 
                  O horário de fim é opcional e pode ser útil para eventos com duração específica.
                </div>
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
                  <FormLabel>Imagem do Evento</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      onRemove={() => field.onChange('')}
                      bucket="imagens_eventos"
                      folder="banners"
                      maxSize={10}
                      accept="image/*"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="submit">
                Criar Evento
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }

  // Renderização original com Dialog para admin
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
                      <FormLabel className="text-sm font-medium">
                        Início do evento *
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="time" 
                            {...field} 
                            className="w-full text-center text-lg font-mono"
                            placeholder="09:00"
                          />
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Horário obrigatório para início
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horario_fim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Fim do evento (opcional)
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="time" 
                            {...field} 
                            className="w-full text-center text-lg font-mono"
                            placeholder="18:00"
                          />
                        </div>
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Deixe vazio se não souber quando termina
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <div className="text-xs text-blue-700">
                  <strong>Dica:</strong> Use horários no formato 24h (exemplo: 14:30 para 2:30 da tarde). 
                  O horário de fim é opcional e pode ser útil para eventos com duração específica.
                </div>
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

            {empresa && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Empresa:</strong> {empresa.nome}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Este evento será associado à sua empresa automaticamente.
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="imagem_banner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imagem do Evento</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      onRemove={() => field.onChange('')}
                      bucket="imagens_eventos"
                      folder="banners"
                      maxSize={10}
                      accept="image/*"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Criar Evento
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
