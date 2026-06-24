import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreateLugarPublico, useUpdateLugarPublico, type LugarPublico } from '@/hooks/useLugaresPublicos';
import { useCidades } from '@/hooks/useCidades';
import { CIDADE_PADRAO_ID } from '@/hooks/useCidadePadrao';

const tiposLugar = [
  { value: 'praca', label: 'Praça' },
  { value: 'biblioteca', label: 'Biblioteca' },
  { value: 'cinema', label: 'Cinema' },
  { value: 'parque', label: 'Parque' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'estacao', label: 'Estação' },
  { value: 'cultura', label: 'Centro Cultural' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'mercado', label: 'Mercado' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'escola', label: 'Escola' },
  { value: 'museu', label: 'Museu' },
];

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  endereco: z.string().optional(),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  imagem_url: z.string().url().optional().or(z.literal('')),
  telefone: z.string().optional(),
  cidade_id: z.string().min(1, 'Cidade é obrigatória'),
  ativo: z.boolean(),
  destaque: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface LugarPublicoFormProps {
  lugar?: LugarPublico;
  onSuccess: () => void;
}

export const LugarPublicoForm = ({ lugar, onSuccess }: LugarPublicoFormProps) => {
  const { data: cidades } = useCidades();
  const createMutation = useCreateLugarPublico();
  const updateMutation = useUpdateLugarPublico();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: lugar?.nome || '',
      descricao: lugar?.descricao || '',
      endereco: lugar?.endereco || '',
      tipo: lugar?.tipo || '',
      imagem_url: lugar?.imagem_url || '',
      telefone: lugar?.telefone || '',
      cidade_id: lugar?.cidade_id || CIDADE_PADRAO_ID,
      ativo: lugar?.ativo !== undefined ? lugar.ativo : true,
      destaque: lugar?.destaque !== undefined ? lugar.destaque : false,
    },
  });

  useEffect(() => {
    if (lugar) {
      form.reset({
        nome: lugar.nome || '',
        descricao: lugar.descricao || '',
        endereco: lugar.endereco || '',
        tipo: lugar.tipo || '',
        imagem_url: lugar.imagem_url || '',
        telefone: lugar.telefone || '',
        cidade_id: lugar.cidade_id || CIDADE_PADRAO_ID,
        ativo: lugar.ativo !== undefined ? lugar.ativo : true,
        destaque: lugar.destaque !== undefined ? lugar.destaque : false,
      });
    }
  }, [lugar, form]);

  const handleSubmit = (data: FormData) => {
    if (lugar) {
      updateMutation.mutate({ id: lugar.id, ...data }, {
        onSuccess: () => {
          onSuccess();
        },
      });
    } else {
      createMutation.mutate(data as {
        nome: string;
        descricao?: string;
        endereco?: string;
        tipo: string;
        imagem_url?: string;
        telefone?: string;
        cidade_id: string;
        ativo: boolean;
        destaque: boolean;
      }, {
        onSuccess: () => {
          onSuccess();
          form.reset();
        },
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nome do lugar" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo do lugar" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tiposLugar.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
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
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Descrição do lugar" />
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
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Endereço completo" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telefone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <PhoneInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imagem_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Imagem</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cidade_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a cidade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {cidades?.map((cidade) => (
                    <SelectItem key={cidade.id} value={cidade.id}>
                      {cidade.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="destaque"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Lugar em Destaque</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ativo"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Ativo</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Salvando...' : lugar ? 'Atualizar' : 'Criar'} Lugar
        </Button>
      </form>
    </Form>
  );
};