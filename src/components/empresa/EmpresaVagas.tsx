import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NeonCard } from '@/components/ui/neon-card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Briefcase, Plus, Edit2, Trash2, Eye, MapPin, Calendar, DollarSign, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { isValidJobApplicationContact } from '@/lib/jobApplication';

interface EmpresaVagasProps {
  empresaId: string;
}

interface VagaEmprego {
  id: string;
  titulo: string;
  descricao: string;
  categoria_id: string;
  bairro_id: string | null;
  cidade_id: string;
  tipo_vaga: string;
  requisitos: string | null;
  faixa_salarial: string | null;
  forma_candidatura: string;
  contato_candidatura: string;
  ativo: boolean;
  destaque: boolean;
  visualizacoes: number;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
  categorias_oportunidades?: {
    nome: string;
  };
}

const TIPOS_VAGA = [
  { value: 'clt', label: 'CLT' },
  { value: 'pj', label: 'PJ' },
  { value: 'estagio', label: 'Estágio' },
  { value: 'temporario', label: 'Temporário' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'meio_periodo', label: 'Meio Período' },
  { value: 'integral', label: 'Tempo Integral' }
];

const FORMAS_CANDIDATURA = [
  { value: 'email', label: 'Por E-mail' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'site', label: 'Site da Empresa' },
  { value: 'linkedin', label: 'LinkedIn' }
];

export const EmpresaVagas = ({ empresaId }: EmpresaVagasProps) => {
  const queryClient = useQueryClient();
  const submittingRef = useRef(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVaga, setEditingVaga] = useState<VagaEmprego | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    requisitos: '',
    faixa_salarial: '',
    tipo_vaga: '',
    forma_candidatura: '',
    contato_candidatura: '',
    categoria_id: ''
  });

  // Buscar categorias de oportunidades
  const { data: categorias = [], isLoading: categoriasLoading, isError: categoriasError, refetch: refetchCategorias } = useQuery({
    queryKey: ['categorias-oportunidades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias_oportunidades')
        .select('*')
        .eq('ativo', true)
        .eq('tipo', 'vaga')
        .order('nome');
      
      if (error) throw error;
      return data;
    }
  });

  // Buscar vagas da empresa
  const { data: vagas = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['empresa-vagas', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vagas_emprego')
        .select(`
          *,
          categorias_oportunidades(nome)
        `)
        .eq('criado_por', empresaId)
        .order('criado_em', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Criar vaga
  const createVagaMutation = useMutation({
    mutationFn: async (data: any) => {
      // Vincule a vaga à cidade real da empresa; nunca use um UUID genérico.
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('cidade_id')
        .eq('id', empresaId)
        .maybeSingle();
      if (empresaError) throw empresaError;
      if (!empresa?.cidade_id) {
        throw new Error('A empresa precisa ter uma cidade cadastrada antes de publicar vagas.');
      }

      const { data: result, error } = await supabase
        .from('vagas_emprego')
        .insert({
          ...data,
          criado_por: empresaId,
          cidade_id: empresa.cidade_id
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('Vaga criada com sucesso!');
      setIsDialogOpen(false);
      resetForm();
      void queryClient.invalidateQueries({ queryKey: ['empresa-vagas', empresaId] });
      void queryClient.invalidateQueries({ queryKey: ['vagas-emprego'] });
      void queryClient.invalidateQueries({ queryKey: ['latest-job-coupons'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao criar vaga: ' + error.message);
    },
    onSettled: () => { submittingRef.current = false; }
  });

  // Atualizar vaga
  const updateVagaMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { data: result, error } = await supabase
        .from('vagas_emprego')
        .update(data)
        .eq('id', id)
        .eq('criado_por', empresaId)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!result) throw new Error('Vaga não encontrada ou sem permissão para editar.');
      return result;
    },
    onSuccess: () => {
      toast.success('Vaga atualizada com sucesso!');
      setIsDialogOpen(false);
      resetForm();
      void queryClient.invalidateQueries({ queryKey: ['empresa-vagas', empresaId] });
      void queryClient.invalidateQueries({ queryKey: ['vagas-emprego'] });
      void queryClient.invalidateQueries({ queryKey: ['latest-job-coupons'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar vaga: ' + error.message);
    },
    onSettled: () => { submittingRef.current = false; }
  });

  // Deletar vaga
  const deleteVagaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: removed, error } = await supabase
        .from('vagas_emprego')
        .delete()
        .eq('id', id)
        .eq('criado_por', empresaId)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!removed) throw new Error('Vaga não encontrada ou sem permissão para excluir.');
    },
    onSuccess: () => {
      toast.success('Vaga removida com sucesso!');
      void queryClient.invalidateQueries({ queryKey: ['empresa-vagas', empresaId] });
      void queryClient.invalidateQueries({ queryKey: ['vagas-emprego'] });
      void queryClient.invalidateQueries({ queryKey: ['latest-job-coupons'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao remover vaga: ' + error.message);
    }
  });

  // Toggle status da vaga
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { data: updated, error } = await supabase
        .from('vagas_emprego')
        .update({ ativo })
        .eq('id', id)
        .eq('criado_por', empresaId)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!updated) throw new Error('Vaga não encontrada ou sem permissão para alterar status.');
    },
    onSuccess: () => {
      toast.success('Status da vaga atualizado!');
      void queryClient.invalidateQueries({ queryKey: ['empresa-vagas', empresaId] });
      void queryClient.invalidateQueries({ queryKey: ['vagas-emprego'] });
      void queryClient.invalidateQueries({ queryKey: ['latest-job-coupons'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      titulo: '',
      descricao: '',
      requisitos: '',
      faixa_salarial: '',
      tipo_vaga: '',
      forma_candidatura: '',
      contato_candidatura: '',
      categoria_id: ''
    });
    setEditingVaga(null);
  };

  const handleEdit = (vaga: VagaEmprego) => {
    setEditingVaga(vaga);
    setFormData({
      titulo: vaga.titulo,
      descricao: vaga.descricao,
      requisitos: vaga.requisitos || '',
      faixa_salarial: vaga.faixa_salarial || '',
      tipo_vaga: vaga.tipo_vaga,
      forma_candidatura: vaga.forma_candidatura,
      contato_candidatura: vaga.contato_candidatura,
      categoria_id: vaga.categoria_id
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || createVagaMutation.isPending || updateVagaMutation.isPending) return;
    if (categoriasLoading || categoriasError || categorias.length === 0) {
      toast.error('As categorias não estão disponíveis. Tente carregá-las novamente.');
      return;
    }

    if (!formData.titulo.trim() || !formData.descricao.trim() ||
        !formData.categoria_id || !formData.tipo_vaga ||
        !formData.forma_candidatura || !formData.contato_candidatura.trim()) {
      toast.error('Preencha os campos obrigatórios, incluindo o tipo de vaga.');
      return;
    }

    if (!isValidJobApplicationContact(formData.forma_candidatura, formData.contato_candidatura)) {
      toast.error('Informe um contato válido para a forma de candidatura escolhida.');
      return;
    }

    const values = {
      ...formData,
      titulo: formData.titulo.trim(),
      descricao: formData.descricao.trim(),
      contato_candidatura: formData.contato_candidatura.trim(),
    };

    submittingRef.current = true;
    if (editingVaga) {
      updateVagaMutation.mutate({ id: editingVaga.id, ...values });
    } else {
      createVagaMutation.mutate(values);
    }
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && (submittingRef.current || createVagaMutation.isPending || updateVagaMutation.isPending)) return;
    setIsDialogOpen(nextOpen);
    if (!nextOpen) resetForm();
  };

  const formatSalario = (faixa: string | null) => {
    return faixa || 'A combinar';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="space-y-3 rounded-2xl border p-6 text-center">
        <h3 className="font-semibold">Não foi possível carregar as vagas da empresa</h3>
        <p className="text-sm text-muted-foreground">Verifique sua conexão e tente novamente.</p>
        <Button type="button" variant="outline" onClick={() => { void refetch(); }}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const actionPending = toggleStatusMutation.isPending || deleteVagaMutation.isPending ||
    createVagaMutation.isPending || updateVagaMutation.isPending || submittingRef.current;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Vagas de Emprego
          </h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as vagas de emprego da sua empresa
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button disabled={actionPending}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Vaga
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVaga ? 'Editar Vaga' : 'Nova Vaga de Emprego'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título da Vaga *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Ex: Desenvolvedor Full Stack"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select 
                    value={formData.categoria_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoria_id: value }))}
                  >
                    <SelectTrigger aria-label="Categoria da vaga" disabled={categoriasLoading || categoriasError || categorias.length === 0}>
                      <SelectValue placeholder={categoriasLoading ? 'Carregando categorias...' : 'Selecione a categoria'} />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {categoriasError && (
                    <div role="alert" className="mt-2 space-y-2 text-sm">
                      <p className="text-destructive">Não foi possível carregar as categorias.</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => { void refetchCategorias(); }}>Tentar novamente</Button>
                    </div>
                  )}
                  {!categoriasLoading && !categoriasError && categorias.length === 0 && (
                    <p role="status" className="mt-2 text-sm text-muted-foreground">Nenhuma categoria de vaga disponível no momento.</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tipo_vaga">Tipo de Vaga *</Label>
                  <Select 
                    value={formData.tipo_vaga} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_vaga: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_VAGA.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="faixa_salarial">Faixa Salarial</Label>
                  <Input
                    id="faixa_salarial"
                    value={formData.faixa_salarial}
                    onChange={(e) => setFormData(prev => ({ ...prev, faixa_salarial: e.target.value }))}
                    placeholder="Ex: R$ 3.000 - R$ 5.000 ou A combinar"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="forma_candidatura">Forma de Candidatura *</Label>
                  <Select 
                    value={formData.forma_candidatura} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, forma_candidatura: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Como candidatar-se?" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAS_CANDIDATURA.map((forma) => (
                        <SelectItem key={forma.value} value={forma.value}>
                          {forma.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contato_candidatura">Contato para Candidatura *</Label>
                  <Input
                    id="contato_candidatura"
                    value={formData.contato_candidatura}
                    onChange={(e) => setFormData(prev => ({ ...prev, contato_candidatura: e.target.value }))}
                    placeholder="Email, WhatsApp, etc."
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição da Vaga *</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descreva as responsabilidades e atividades da vaga..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requisitos">Requisitos</Label>
                <Textarea
                  id="requisitos"
                  value={formData.requisitos}
                  onChange={(e) => setFormData(prev => ({ ...prev, requisitos: e.target.value }))}
                  placeholder="Liste os requisitos necessários para a vaga..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleDialogOpenChange(false)}
                  disabled={createVagaMutation.isPending || updateVagaMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createVagaMutation.isPending || updateVagaMutation.isPending || categoriasLoading || categoriasError || categorias.length === 0 || !formData.categoria_id || !formData.tipo_vaga}
                >
                  {createVagaMutation.isPending || updateVagaMutation.isPending ? 'Salvando...' : 
                   editingVaga ? 'Atualizar' : 'Criar Vaga'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {vagas.length === 0 ? (
        <NeonCard>
          <CardContent className="text-center py-12">
            <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma vaga cadastrada</h3>
            <p className="text-muted-foreground mb-6">
              Comece criando sua primeira vaga de emprego para atrair talentos.
            </p>
            <Button disabled={actionPending} onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Vaga
            </Button>
          </CardContent>
        </NeonCard>
      ) : (
        <div className="grid gap-4">
          {vagas.map((vaga) => (
            <NeonCard key={vaga.id} className={`${!vaga.ativo ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg">{vaga.titulo}</CardTitle>
                      <Badge variant={vaga.ativo ? 'default' : 'secondary'}>
                        {vaga.ativo ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      {vaga.categorias_oportunidades && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {vaga.categorias_oportunidades.nome}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(vaga.criado_em), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {vaga.visualizacoes} visualizações
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionPending}
                      aria-label={vaga.ativo ? `Pausar vaga ${vaga.titulo}` : `Ativar vaga ${vaga.titulo}`}
                      onClick={() => toggleStatusMutation.mutate({ 
                        id: vaga.id, 
                        ativo: !vaga.ativo 
                      })}
                    >
                      {vaga.ativo ? 'Pausar' : 'Ativar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionPending}
                      aria-label={`Editar vaga ${vaga.titulo}`}
                      onClick={() => handleEdit(vaga)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={actionPending}
                      aria-label={`Excluir vaga ${vaga.titulo}`}
                      onClick={() => {
                        if (actionPending) return;
                        if (confirm(`Excluir a vaga "${vaga.titulo}"? Esta ação não pode ser desfeita.`)) {
                          deleteVagaMutation.mutate(vaga.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm line-clamp-3">{vaga.descricao}</p>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    {vaga.tipo_vaga && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {TIPOS_VAGA.find(t => t.value === vaga.tipo_vaga)?.label || vaga.tipo_vaga}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {formatSalario(vaga.faixa_salarial)}
                    </span>
                  </div>
                </div>
                
                {vaga.requisitos && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Requisitos:</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{vaga.requisitos}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </NeonCard>
          ))}
        </div>
      )}
    </div>
  );
};