import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Briefcase } from 'lucide-react';

interface VagaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export const VagaFormModal = ({ open, onOpenChange }: VagaFormModalProps) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
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

  // Buscar empresa do usuário logado
  const { data: empresaUsuario } = useQuery({
    queryKey: ['minha-empresa', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('usuario_id', profile.id)
        .eq('ativo', true)
        .eq('status_aprovacao', 'aprovado')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id && profile?.tipo_conta === 'empresa'
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

  // Criar vaga
  const createVagaMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!empresaUsuario?.id) {
        throw new Error('Empresa não encontrada. Verifique se sua empresa está aprovada.');
      }

      const { data: result, error } = await supabase
        .from('vagas_emprego')
        .insert({
          ...data,
          criado_por: empresaUsuario.id,
          cidade_id: empresaUsuario.cidade_id
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('Vaga criada com sucesso!');
      onOpenChange(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['vagas-emprego'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao criar vaga: ' + error.message);
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.descricao || !formData.categoria_id || !formData.forma_candidatura || !formData.contato_candidatura) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    createVagaMutation.mutate(formData);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!empresaUsuario ? (
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Publicar Vaga
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Para publicar vagas, você precisa ter uma empresa aprovada.
            </p>
          </div>
        </DialogContent>
      ) : (
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Publicar Nova Vaga de Emprego
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
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            disabled={createVagaMutation.isPending}
          >
            {createVagaMutation.isPending ? 'Publicando...' : 'Publicar Vaga'}
          </Button>
        </div>
        </form>
        </DialogContent>
      )}
    </Dialog>
  );
};