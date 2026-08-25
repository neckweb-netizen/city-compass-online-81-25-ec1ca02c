import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Plus, Calendar, Clock, Upload, X, Loader2, Users, UserPlus, Ticket, Repeat2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCategoriasEventos } from '@/hooks/useCategorias';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useMinhaEmpresa } from '@/hooks/useMinhaEmpresa';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { usePlanoLimites } from '@/hooks/usePlanoLimites';
import { cn } from '@/lib/utils';
import { uploadMedia } from '@/lib/media-upload';

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
  gratuito: z.boolean(),
  preco: z.coerce.number().min(0).max(1000000),
  preco_descricao: z.string().max(160).optional(),
  link_ingressos: z.union([z.string().url('Informe um link válido'), z.literal('')]).optional(),
  recorrencia: z.enum(['nenhuma', 'semanal', 'quinzenal', 'mensal']),
  publico_alvo: z.string().max(200).optional(),
  acessibilidade: z.string().max(500).optional(),
  checkin_ativo: z.boolean(),
  avaliacoes_ativas: z.boolean(),
  lista_participantes_ativa: z.boolean(),
  lista_exibir_nomes: z.boolean(),
  limite_participantes: z.coerce.number().int().min(1).max(10000),
  fila_espera_ativa: z.boolean(),
  permitir_acompanhantes: z.boolean(),
  limite_acompanhantes: z.coerce.number().int().min(0).max(20),
  inscricoes_encerram_em: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.lista_participantes_ativa && data.limite_participantes < 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['limite_participantes'], message: 'Informe pelo menos uma vaga.' });
  }
  if (data.lista_participantes_ativa && data.permitir_acompanhantes && data.limite_acompanhantes < 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['limite_acompanhantes'], message: 'Informe pelo menos um acompanhante.' });
  }
  if (!data.gratuito && data.preco <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['preco'], message: 'Informe o valor do ingresso.' });
  }
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
  const { data: categorias } = useCategoriasEventos();
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
      gratuito: true,
      preco: 0,
      preco_descricao: '',
      link_ingressos: '',
      recorrencia: 'nenhuma',
      publico_alvo: '',
      acessibilidade: '',
      checkin_ativo: false,
      avaliacoes_ativas: true,
      lista_participantes_ativa: false,
      lista_exibir_nomes: false,
      limite_participantes: 100,
      fila_espera_ativa: true,
      permitir_acompanhantes: false,
      limite_acompanhantes: 1,
      inscricoes_encerram_em: '',
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
      const url = await uploadMedia(file, 'eventos');
      onChange(url);
      toast({ title: 'Imagem enviada com sucesso!' });
    } catch (error: any) {
      toast({
        title: 'Erro no envio da imagem',
        description: error.message || 'Falha ao enviar a imagem.',
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
        gratuito: data.gratuito,
        preco: data.gratuito ? null : data.preco,
        preco_descricao: data.gratuito ? null : data.preco_descricao || null,
        link_ingressos: data.link_ingressos || null,
        recorrencia: data.recorrencia,
        publico_alvo: data.publico_alvo || null,
        acessibilidade: data.acessibilidade || null,
        checkin_ativo: data.lista_participantes_ativa && data.checkin_ativo,
        avaliacoes_ativas: data.avaliacoes_ativas,
        cidade_id: cidadeId,
        hora_fim: data.horario_fim || null,
        lista_participantes_ativa: data.lista_participantes_ativa,
        lista_exibir_nomes: data.lista_participantes_ativa && data.lista_exibir_nomes,
        limite_participantes: data.lista_participantes_ativa ? data.limite_participantes : null,
        fila_espera_ativa: data.lista_participantes_ativa && data.fila_espera_ativa,
        permitir_acompanhantes: data.lista_participantes_ativa && data.permitir_acompanhantes,
        limite_acompanhantes: data.lista_participantes_ativa && data.permitir_acompanhantes ? data.limite_acompanhantes : 0,
        inscricoes_encerram_em: data.lista_participantes_ativa && data.inscricoes_encerram_em
          ? new Date(data.inscricoes_encerram_em).toISOString()
          : null,
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
                  {categorias?.map((categoria) => (
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

        <div className="space-y-4 rounded-2xl border p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2"><Ticket className="h-5 w-5 text-amber-600" /></div>
            <div><h3 className="font-semibold">Ingressos e informações profissionais</h3><p className="text-sm text-muted-foreground">Defina preço, recorrência, público e recursos do evento.</p></div>
          </div>

          <FormField control={form.control} name="gratuito" render={({ field }) => (
            <FormItem className="flex items-center justify-between gap-4 rounded-xl border bg-background p-4"><div><FormLabel>Evento gratuito</FormLabel><p className="text-xs text-muted-foreground">Desative para informar o valor do ingresso.</p></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
          )} />

          {!form.watch('gratuito') && <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="preco" render={({ field }) => (<FormItem><FormLabel>Preço a partir de (R$)</FormLabel><FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="preco_descricao" render={({ field }) => (<FormItem><FormLabel>Detalhes do preço</FormLabel><FormControl><Input placeholder="Ex.: meia R$ 20, inteira R$ 40" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>}

          <FormField control={form.control} name="link_ingressos" render={({ field }) => (<FormItem><FormLabel>Link para ingressos ou inscrições</FormLabel><FormControl><Input type="url" placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>)} />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="recorrencia" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Repeat2 className="h-4 w-4" />Recorrência</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="nenhuma">Evento único</SelectItem><SelectItem value="semanal">Toda semana</SelectItem><SelectItem value="quinzenal">A cada 15 dias</SelectItem><SelectItem value="mensal">Todo mês</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="publico_alvo" render={({ field }) => (<FormItem><FormLabel>Público recomendado</FormLabel><FormControl><Input placeholder="Ex.: livre, famílias, maiores de 18" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>

          <FormField control={form.control} name="acessibilidade" render={({ field }) => (<FormItem><FormLabel>Acessibilidade</FormLabel><FormControl><Textarea className="min-h-20" placeholder="Ex.: acesso para cadeirantes, Libras, assentos preferenciais" {...field} /></FormControl><FormMessage /></FormItem>)} />

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField control={form.control} name="checkin_ativo" render={({ field }) => (<FormItem className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3"><div><FormLabel>Check-in</FormLabel><p className="text-xs text-muted-foreground">Controle a chegada dos inscritos.</p></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="avaliacoes_ativas" render={({ field }) => (<FormItem className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3"><div><FormLabel>Avaliações</FormLabel><p className="text-xs text-muted-foreground">Receba notas após o evento.</p></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-emerald-600" />Inscrições, avaliações e check-ins possuem controle de acesso.</div>
        </div>

        <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2"><Users className="h-5 w-5 text-primary" /></div>
            <div>
              <h3 className="font-semibold">Lista de participantes</h3>
              <p className="text-sm text-muted-foreground">Controle inscrições, vagas e fila de espera diretamente pelo evento.</p>
            </div>
          </div>

          <FormField control={form.control} name="lista_participantes_ativa" render={({ field }) => (
            <FormItem className="flex items-center justify-between gap-4 rounded-xl border bg-background p-4">
              <div><FormLabel>Ativar lista de nomes</FormLabel><p className="text-xs text-muted-foreground">Os usuários poderão confirmar presença informando o nome.</p></div>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )} />

          {form.watch('lista_participantes_ativa') && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="limite_participantes" render={({ field }) => (
                  <FormItem><FormLabel>Limite total de pessoas</FormLabel><FormControl><Input type="number" min="1" max="10000" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="inscricoes_encerram_em" render={({ field }) => (
                  <FormItem><FormLabel>Encerrar inscrições em</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><p className="text-xs text-muted-foreground">Opcional. Sem data, encerra quando o evento começar.</p><FormMessage /></FormItem>
                )} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField control={form.control} name="lista_exibir_nomes" render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3"><div><FormLabel>Lista pública</FormLabel><p className="text-xs text-muted-foreground">Exibe os nomes confirmados na página.</p></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="fila_espera_ativa" render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3"><div><FormLabel>Fila de espera</FormLabel><p className="text-xs text-muted-foreground">Aceita interessados após lotar.</p></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                )} />
              </div>

              <FormField control={form.control} name="permitir_acompanhantes" render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3"><div className="flex items-start gap-2"><UserPlus className="mt-0.5 h-4 w-4 text-primary" /><div><FormLabel>Permitir acompanhantes</FormLabel><p className="text-xs text-muted-foreground">O limite considera titular e acompanhantes.</p></div></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
              )} />
              {form.watch('permitir_acompanhantes') && (
                <FormField control={form.control} name="limite_acompanhantes" render={({ field }) => (
                  <FormItem><FormLabel>Máximo de acompanhantes por inscrição</FormLabel><FormControl><Input type="number" min="1" max="20" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              )}
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="imagem_banner"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagem do evento</FormLabel>
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
                            <p className="text-xs text-muted-foreground">Imagem otimizada automaticamente para carregamento rápido</p>
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
