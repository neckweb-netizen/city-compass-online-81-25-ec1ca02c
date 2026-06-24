import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Wrench, MapPin, Phone, Mail, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Servico {
  id: string;
  nome_prestador: string;
  email_prestador: string;
  telefone_prestador?: string;
  whatsapp_prestador?: string;
  categoria_id: string;
  descricao_servico: string;
  cidade_id: string;
  foto_perfil_url?: string;
  status_aprovacao: 'pendente' | 'aprovado' | 'rejeitado';
  observacoes_admin?: string;
  aprovado_por?: string;
  data_aprovacao?: string;
  visualizacoes: number;
  usuario_id?: string;
  criado_em: string;
  atualizado_em: string;
}

export function AdminServicos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);
  const queryClient = useQueryClient();

  const { data: servicos, isLoading } = useQuery({
    queryKey: ['admin-servicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servicos_autonomos')
        .select('*')
        .order('criado_em', { ascending: false });
      
      if (error) throw error;
      return data as Servico[];
    }
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias-servicos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_oportunidades')
        .select('*')
        .eq('tipo', 'servico')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: cidades = [] } = useQuery({
    queryKey: ['cidades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cidades')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (servico: any) => {
      const { data, error } = await supabase
        .from('servicos_autonomos')
        .insert([{
          ...servico,
          visualizacoes: 0
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-servicos'] });
      toast.success('Serviço criado com sucesso!');
      setIsDialogOpen(false);
      setEditingServico(null);
    },
    onError: (error) => {
      toast.error('Erro ao criar serviço: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...servico }: any) => {
      const { data, error } = await supabase
        .from('servicos_autonomos')
        .update(servico)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-servicos'] });
      toast.success('Serviço atualizado com sucesso!');
      setIsDialogOpen(false);
      setEditingServico(null);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar serviço: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('servicos_autonomos')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-servicos'] });
      toast.success('Serviço excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir serviço: ' + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const servico = {
      nome_prestador: formData.get('nome_prestador') as string,
      email_prestador: formData.get('email_prestador') as string,
      telefone_prestador: formData.get('telefone_prestador') as string || null,
      whatsapp_prestador: formData.get('whatsapp_prestador') as string || null,
      categoria_id: formData.get('categoria_id') as string,
      descricao_servico: formData.get('descricao_servico') as string,
      bairros_atendimento: [],
      cidade_id: formData.get('cidade_id') as string,
      status_aprovacao: formData.get('status_aprovacao') as string,
      observacoes_admin: formData.get('observacoes_admin') as string || null,
    };

    if (editingServico) {
      updateMutation.mutate({ id: editingServico.id, ...servico });
    } else {
      createMutation.mutate(servico);
    }
  };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Serviços Autônomos</h1>
          <p className="text-muted-foreground">Gerencie os serviços autônomos disponíveis</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingServico(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingServico ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
              <DialogDescription>
                {editingServico ? 'Edite as informações do serviço' : 'Preencha as informações do novo serviço'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_prestador">Nome do Prestador</Label>
                  <Input
                    id="nome_prestador"
                    name="nome_prestador"
                    defaultValue={editingServico?.nome_prestador}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_prestador">E-mail</Label>
                  <Input
                    id="email_prestador"
                    name="email_prestador"
                    type="email"
                    defaultValue={editingServico?.email_prestador}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao_servico">Descrição do Serviço</Label>
                <Textarea
                  id="descricao_servico"
                  name="descricao_servico"
                  defaultValue={editingServico?.descricao_servico}
                  required
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone_prestador">Telefone</Label>
                  <Input
                    id="telefone_prestador"
                    name="telefone_prestador"
                    defaultValue={editingServico?.telefone_prestador || ''}
                    placeholder="Ex: (75) 3333-3333"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_prestador">WhatsApp</Label>
                  <Input
                    id="whatsapp_prestador"
                    name="whatsapp_prestador"
                    defaultValue={editingServico?.whatsapp_prestador || ''}
                    placeholder="Ex: (75) 99999-9999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria_id">Categoria</Label>
                  <Select name="categoria_id" defaultValue={editingServico?.categoria_id || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias?.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade_id">Cidade</Label>
                  <Select name="cidade_id" defaultValue={editingServico?.cidade_id || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {cidades?.map((cidade) => (
                        <SelectItem key={cidade.id} value={cidade.id}>
                          {cidade.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status_aprovacao">Status</Label>
                <Select name="status_aprovacao" defaultValue={editingServico?.status_aprovacao || 'pendente'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes_admin">Observações do Admin</Label>
                <Textarea
                  id="observacoes_admin"
                  name="observacoes_admin"
                  defaultValue={editingServico?.observacoes_admin || ''}
                  rows={3}
                  placeholder="Observações internas sobre o serviço"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingServico ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {servicos?.map((servico) => (
          <Card key={servico.id} className="w-full">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5" />
                    {servico.nome_prestador}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{servico.email_prestador}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    servico.status_aprovacao === 'aprovado' ? "default" : 
                    servico.status_aprovacao === 'rejeitado' ? "destructive" : "secondary"
                  }>
                    {servico.status_aprovacao === 'aprovado' ? 'Aprovado' : 
                     servico.status_aprovacao === 'rejeitado' ? 'Rejeitado' : 'Pendente'}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    {servico.visualizacoes}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingServico(servico);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(servico.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{servico.descricao_servico}</p>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {servico.telefone_prestador && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {servico.telefone_prestador}
                  </div>
                )}
                {servico.whatsapp_prestador && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    WhatsApp: {servico.whatsapp_prestador}
                  </div>
                )}
              </div>

              {servico.observacoes_admin && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Observações do Admin:</h4>
                  <p className="text-sm text-muted-foreground">{servico.observacoes_admin}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {(!servicos || servicos.length === 0) && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum serviço encontrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                Ainda não há serviços autônomos cadastrados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}