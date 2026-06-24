
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { User, CheckCircle, Info, ArrowLeft, Sparkles, Camera } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageUpload } from '@/components/ui/image-upload';

const AnunciarServico = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    nome_prestador: '',
    email_prestador: '',
    telefone_prestador: '',
    whatsapp_prestador: '',
    categoria_id: undefined as string | undefined,
    descricao_servico: '',
    foto_perfil_url: ''
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

  const criarServico = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Buscar cidade padrão (primeira cidade ativa)
      const { data: cidades, error: cidadeError } = await supabase
        .from('cidades')
        .select('id')
        .eq('ativo', true)
        .limit(1);

      if (cidadeError) throw cidadeError;
      if (!cidades || cidades.length === 0) throw new Error('Nenhuma cidade encontrada');

      const { error } = await supabase
        .from('servicos_autonomos')
        .insert({
          nome_prestador: data.nome_prestador,
          email_prestador: data.email_prestador,
          telefone_prestador: data.telefone_prestador || null,
          whatsapp_prestador: data.whatsapp_prestador || null,
          categoria_id: data.categoria_id,
          descricao_servico: data.descricao_servico,
          bairros_atendimento: [],
          cidade_id: cidades[0].id,
          foto_perfil_url: data.foto_perfil_url || null,
          usuario_id: user?.id || null
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Serviço enviado com sucesso!",
        description: "Seu anúncio será analisado e, se aprovado, ficará disponível em breve.",
      });
      navigate('/oportunidades');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar serviço",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted', formData); // Debug log
    
    if (!formData.nome_prestador || !formData.email_prestador || !formData.categoria_id || 
        !formData.descricao_servico) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    console.log('Validação passou, enviando...'); // Debug log
    criarServico.mutate(formData);
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold text-primary">
                Anunciar Serviço
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Divulgue seus serviços profissionais e conecte-se com novos clientes
              </p>
            </div>
            <Button asChild variant="outline" size="lg">
              <Link to="/oportunidades" className="flex items-center">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>

          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-5 w-5 text-primary" />
            <AlertDescription className="text-base">
              Seu anúncio será analisado por nossa equipe antes de ser publicado. 
              Você receberá uma notificação quando for aprovado.
            </AlertDescription>
          </Alert>

          <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <User className="w-6 h-6 text-primary" />
                </div>
                Informações do Prestador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-base font-medium">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome_prestador}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome_prestador: e.target.value }))}
                      placeholder="Seu nome completo"
                      className="h-12 border-2 focus:border-primary/50 transition-colors duration-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base font-medium">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email_prestador}
                      onChange={(e) => setFormData(prev => ({ ...prev, email_prestador: e.target.value }))}
                      placeholder="seu@email.com"
                      className="h-12 border-2 focus:border-primary/50 transition-colors duration-300"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="telefone" className="text-base font-medium">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone_prestador}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefone_prestador: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      className="h-12 border-2 focus:border-primary/50 transition-colors duration-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-base font-medium">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp_prestador}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_prestador: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      className="h-12 border-2 focus:border-primary/50 transition-colors duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria" className="text-base font-medium">Categoria do Serviço *</Label>
                  <Select value={formData.categoria_id || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, categoria_id: value }))}>
                    <SelectTrigger className="h-12 border-2 focus:border-primary/50 transition-colors duration-300">
                      <SelectValue placeholder="Selecione a categoria do seu serviço" />
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

                <div className="space-y-2">
                  <Label htmlFor="descricao" className="text-base font-medium">Descrição do Serviço *</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao_servico}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao_servico: e.target.value }))}
                    placeholder="Descreva detalhadamente os serviços que você oferece, sua experiência e diferenciais..."
                    rows={6}
                    className="border-2 focus:border-primary/50 transition-colors duration-300 resize-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Camera className="w-5 h-5 text-primary" />
                    Foto de Perfil (opcional)
                  </Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adicione uma foto para aumentar a confiança dos clientes
                  </p>
                  <ImageUpload
                    bucket="imagens_empresas"
                    value={formData.foto_perfil_url}
                    onChange={(url) => setFormData(prev => ({ ...prev, foto_perfil_url: url }))}
                    className="w-full"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border">
                  <Button
                    type="submit"
                    disabled={criarServico.isPending}
                    size="lg"
                    className="flex-1 h-16 text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                  >
                    {criarServico.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Enviar para Análise
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" size="lg" asChild className="h-12">
                    <Link to="/oportunidades">
                      Cancelar
                    </Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnunciarServico;
