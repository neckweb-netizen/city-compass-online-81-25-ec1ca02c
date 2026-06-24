import { useState } from 'react';
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
  const { data: categorias = [] } = useQuery({
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
  const { data: vagas = [], isLoading, refetch } = useQuery({
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
      const { data: result, error } = await supabase
        .from('vagas_emprego')
        .insert({
          ...data,
          criado_por: empresaId,
          cidade_id: data.cidade_id || '550e8400-e29b-41d4-a716-446655440000' // Cidade padrão
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
      refetch();
    },
    onError: (error: any) => {
      toast.error('Erro ao criar vaga: ' + error.message);
    }
  });

  // Atualizar vaga
  const updateVagaMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { data: result, error } = await supabase
        .from('vagas_emprego')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('Vaga atualizada com sucesso!');
      setIsDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar vaga: ' + error.message);
    }
  });

  // Deletar vaga
  const deleteVagaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vagas_emprego')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Vaga removida com sucesso!');
      refetch();
    },
    onError: (error: any) => {
      toast.error('Erro ao remover vaga: ' + error.message);
    }
  });

  // Toggle status da vaga
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('vagas_emprego')
        .update({ ativo })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status da vaga atualizado!');
      refetch();
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
    
    if (!formData.titulo || !formData.descricao || !formData.categoria_id || !formData.forma_candidatura || !formData.contato_candidatura) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (editingVaga) {
      updateVagaMutation.mutate({ id: editingVaga.id, ...formData });
    } else {
      createVagaMutation.mutate(formData);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Vagas de Emprego
          </h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as vagas de emprego da sua empresa
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
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
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tipo_vaga">Tipo de Vaga</Label>
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
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createVagaMutation.isPending || updateVagaMutation.isPending}
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
            <Button onClick={() => setIsDialogOpen(true)}>
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
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{vaga.titulo}</CardTitle>
                      <Badge variant={vaga.ativo ? 'default' : 'secondary'}>
                        {vaga.ativo ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
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
                      onClick={() => handleEdit(vaga)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir esta vaga?')) {
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