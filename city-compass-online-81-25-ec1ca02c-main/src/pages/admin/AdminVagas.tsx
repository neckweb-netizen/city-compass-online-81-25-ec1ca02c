
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Briefcase, MapPin, Clock, DollarSign } from "lucide-react";
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

interface Vaga {
  id: string;
  titulo: string;
  descricao: string;
  categoria_id: string;
  cidade_id: string;
  tipo_vaga: 'clt' | 'temporario' | 'estagio' | 'freelance';
  requisitos?: string;
  faixa_salarial?: string;
  forma_candidatura: string;
  contato_candidatura: string;
  ativo: boolean;
  destaque: boolean;
  visualizacoes: number;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
}

interface VagaInput {
  titulo: string;
  descricao: string;
  categoria_id: string;
  cidade_id: string;
  tipo_vaga: 'clt' | 'temporario' | 'estagio' | 'freelance';
  requisitos: string | null;
  faixa_salarial: string | null;
  forma_candidatura: string;
  contato_candidatura: string;
  ativo: boolean;
}

interface VagaUpdate extends VagaInput {
  id: string;
}

export function AdminVagas() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVaga, setEditingVaga] = useState<Vaga | null>(null);
  const queryClient = useQueryClient();

  const { data: vagas, isLoading } = useQuery({
    queryKey: ['admin-vagas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vagas_emprego')
        .select('*')
        .order('criado_em', { ascending: false });
      
      if (error) throw error;
      return data as Vaga[];
    }
  });

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome')
        .eq('ativo', true);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: cidades } = useQuery({
    queryKey: ['cidades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cidades')
        .select('id, nome')
        .eq('ativo', true);
      
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (vaga: VagaInput) => {
      const { data, error } = await supabase
        .from('vagas_emprego')
        .insert({
          ...vaga,
          criado_por: '00000000-0000-0000-0000-000000000000', // Placeholder para admin
          visualizacoes: 0,
          destaque: false
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vagas'] });
      toast.success('Vaga criada com sucesso!');
      setIsDialogOpen(false);
      setEditingVaga(null);
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar vaga: ' + error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (vaga: VagaUpdate) => {
      const { id, ...updateData } = vaga;
      const { data, error } = await supabase
        .from('vagas_emprego')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vagas'] });
      toast.success('Vaga atualizada com sucesso!');
      setIsDialogOpen(false);
      setEditingVaga(null);
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar vaga: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vagas_emprego')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vagas'] });
      toast.success('Vaga excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir vaga: ' + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const vaga: VagaInput = {
      titulo: formData.get('titulo') as string,
      descricao: formData.get('descricao') as string,
      categoria_id: formData.get('categoria_id') as string,
      cidade_id: formData.get('cidade_id') as string,
      tipo_vaga: formData.get('tipo_vaga') as 'clt' | 'temporario' | 'estagio' | 'freelance',
      requisitos: formData.get('requisitos') as string || null,
      faixa_salarial: formData.get('faixa_salarial') as string || null,
      forma_candidatura: formData.get('forma_candidatura') as string,
      contato_candidatura: formData.get('contato_candidatura') as string,
      ativo: formData.get('ativo') === 'true',
    };

    if (editingVaga) {
      updateMutation.mutate({ id: editingVaga.id, ...vaga });
    } else {
      createMutation.mutate(vaga);
    }
  };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vagas de Emprego</h1>
          <p className="text-muted-foreground">Gerencie as vagas de emprego disponíveis</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingVaga(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Vaga
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingVaga ? 'Editar Vaga' : 'Nova Vaga'}</DialogTitle>
              <DialogDescription>
                {editingVaga ? 'Edite as informações da vaga' : 'Preencha as informações da nova vaga'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título da Vaga</Label>
                  <Input
                    id="titulo"
                    name="titulo"
                    defaultValue={editingVaga?.titulo}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria_id">Categoria</Label>
                  <Select name="categoria_id" defaultValue={editingVaga?.categoria_id || ''}>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  defaultValue={editingVaga?.descricao}
                  required
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade_id">Cidade</Label>
                  <Select name="cidade_id" defaultValue={editingVaga?.cidade_id || ''}>
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
                <div className="space-y-2">
                  <Label htmlFor="faixa_salarial">Faixa Salarial</Label>
                  <Input
                    id="faixa_salarial"
                    name="faixa_salarial"
                    defaultValue={editingVaga?.faixa_salarial || ''}
                    placeholder="Ex: R$ 2.500 - R$ 3.000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_vaga">Tipo de Vaga</Label>
                  <Select name="tipo_vaga" defaultValue={editingVaga?.tipo_vaga || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clt">CLT</SelectItem>
                      <SelectItem value="temporario">Temporário</SelectItem>
                      <SelectItem value="estagio">Estágio</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ativo">Status</Label>
                  <Select name="ativo" defaultValue={editingVaga?.ativo ? 'true' : 'false'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Ativa</SelectItem>
                      <SelectItem value="false">Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="forma_candidatura">Forma de Candidatura</Label>
                  <Input
                    id="forma_candidatura"
                    name="forma_candidatura"
                    defaultValue={editingVaga?.forma_candidatura}
                    required
                    placeholder="Ex: email, presencial, whatsapp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contato_candidatura">Contato para Candidatura</Label>
                  <Input
                    id="contato_candidatura"
                    name="contato_candidatura"
                    defaultValue={editingVaga?.contato_candidatura}
                    required
                    placeholder="Ex: email@empresa.com, (75) 99999-9999"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requisitos">Requisitos</Label>
                <Textarea
                  id="requisitos"
                  name="requisitos"
                  defaultValue={editingVaga?.requisitos || ''}
                  rows={3}
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
                  {editingVaga ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {vagas?.map((vaga) => (
          <Card key={vaga.id} className="w-full">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    {vaga.titulo}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">{vaga.tipo_vaga}</Badge>
                    {vaga.destaque && <Badge variant="default">Destaque</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={vaga.ativo ? "default" : "secondary"}>
                    {vaga.ativo ? "Ativa" : "Inativa"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingVaga(vaga);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(vaga.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{vaga.descricao}</p>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {vaga.faixa_salarial && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {vaga.faixa_salarial}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {vaga.forma_candidatura}
                </div>
              </div>

              {vaga.requisitos && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Requisitos:</h4>
                  <p className="text-sm text-muted-foreground">{vaga.requisitos}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-sm mb-1">Contato:</h4>
                <p className="text-sm text-muted-foreground">{vaga.contato_candidatura}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {(!vagas || vagas.length === 0) && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma vaga encontrada</h3>
              <p className="text-muted-foreground text-center mb-4">
                Ainda não há vagas de emprego cadastradas.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
