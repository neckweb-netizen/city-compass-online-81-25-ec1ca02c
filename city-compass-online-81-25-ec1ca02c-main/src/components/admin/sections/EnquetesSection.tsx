import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Vote, 
  Edit, 
  Trash2, 
  Calendar,
  Users,
  BarChart3,
  Eye,
  EyeOff,
  TrendingUp
} from 'lucide-react';
import { useEnquetes } from '@/hooks/useEnquetes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface EnqueteForm {
  titulo: string;
  descricao: string;
  opcoes: string[];
  multipla_escolha: boolean;
  ativo: boolean;
  data_inicio: string;
  data_fim: string;
}

export const EnquetesSection = () => {
  const { enquetes, enqueteAtiva, isLoadingAll, criarEnquete, atualizarEnquete, excluirEnquete } = useEnquetes();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEnquete, setEditingEnquete] = useState<string | null>(null);
  const [form, setForm] = useState<EnqueteForm>({
    titulo: '',
    descricao: '',
    opcoes: ['', ''],
    multipla_escolha: false,
    ativo: true,
    data_inicio: new Date().toISOString().slice(0, 16),
    data_fim: ''
  });

  const resetForm = () => {
    setForm({
      titulo: '',
      descricao: '',
      opcoes: ['', ''],
      multipla_escolha: false,
      ativo: true,
      data_inicio: new Date().toISOString().slice(0, 16),
      data_fim: ''
    });
    setEditingEnquete(null);
  };

  const handleSubmit = () => {
    const opcoesFiltradas = form.opcoes.filter(opcao => opcao.trim() !== '');
    
    if (form.titulo.trim() === '' || opcoesFiltradas.length < 2) {
      return;
    }

    const enqueteData = {
      titulo: form.titulo,
      descricao: form.descricao || null,
      opcoes: opcoesFiltradas,
      multipla_escolha: form.multipla_escolha,
      ativo: form.ativo,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim || null
    };

    if (editingEnquete) {
      atualizarEnquete.mutate(
        { id: editingEnquete, ...enqueteData },
        { onSuccess: () => { setIsDialogOpen(false); resetForm(); }}
      );
    } else {
      criarEnquete.mutate(
        enqueteData,
        { onSuccess: () => { setIsDialogOpen(false); resetForm(); }}
      );
    }
  };

  const handleEdit = (enquete: any) => {
    setForm({
      titulo: enquete.titulo,
      descricao: enquete.descricao || '',
      opcoes: enquete.opcoes,
      multipla_escolha: enquete.multipla_escolha,
      ativo: enquete.ativo,
      data_inicio: enquete.data_inicio ? new Date(enquete.data_inicio).toISOString().slice(0, 16) : '',
      data_fim: enquete.data_fim ? new Date(enquete.data_fim).toISOString().slice(0, 16) : ''
    });
    setEditingEnquete(enquete.id);
    setIsDialogOpen(true);
  };

  const addOpcao = () => {
    setForm({ ...form, opcoes: [...form.opcoes, ''] });
  };

  const removeOpcao = (index: number) => {
    if (form.opcoes.length > 2) {
      setForm({ ...form, opcoes: form.opcoes.filter((_, i) => i !== index) });
    }
  };

  const updateOpcao = (index: number, value: string) => {
    const newOpcoes = [...form.opcoes];
    newOpcoes[index] = value;
    setForm({ ...form, opcoes: newOpcoes });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isActive = (enquete: any) => {
    if (!enquete.ativo) return false;
    const now = new Date();
    const inicio = new Date(enquete.data_inicio);
    const fim = enquete.data_fim ? new Date(enquete.data_fim) : null;
    
    return inicio <= now && (!fim || fim >= now);
  };

  const getPercentage = (opcaoIndex: number) => {
    if (!enqueteAtiva || enqueteAtiva.total_votos === 0) return 0;
    const resultado = enqueteAtiva.resultados.find(r => r.opcao_indice === opcaoIndex);
    return resultado ? (resultado.count / enqueteAtiva.total_votos) * 100 : 0;
  };

  const getVotes = (opcaoIndex: number) => {
    if (!enqueteAtiva) return 0;
    const resultado = enqueteAtiva.resultados.find(r => r.opcao_indice === opcaoIndex);
    return resultado?.count || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Enquetes</h1>
          <p className="text-muted-foreground">
            Crie e gerencie enquetes e visualize relatórios de desempenho
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Enquete
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEnquete ? 'Editar Enquete' : 'Nova Enquete'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Digite o título da enquete"
                />
              </div>
              
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descrição opcional da enquete"
                  rows={2}
                />
              </div>
              
              <div>
                <Label>Opções de Resposta *</Label>
                <div className="space-y-2 mt-2">
                  {form.opcoes.map((opcao, index) => (
                    <div key={index} className="flex space-x-2">
                      <Input
                        value={opcao}
                        onChange={(e) => updateOpcao(index, e.target.value)}
                        placeholder={`Opção ${index + 1}`}
                      />
                      {form.opcoes.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeOpcao(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addOpcao}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Opção
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="multipla-escolha"
                  checked={form.multipla_escolha}
                  onCheckedChange={(checked) => setForm({ ...form, multipla_escolha: checked })}
                />
                <Label htmlFor="multipla-escolha">Permitir múltipla escolha</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={form.ativo}
                  onCheckedChange={(checked) => setForm({ ...form, ativo: checked })}
                />
                <Label htmlFor="ativo">Enquete ativa</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="data-inicio">Data de Início *</Label>
                  <Input
                    id="data-inicio"
                    type="datetime-local"
                    value={form.data_inicio}
                    onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="data-fim">Data de Fim</Label>
                  <Input
                    id="data-fim"
                    type="datetime-local"
                    value={form.data_fim}
                    onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!form.titulo.trim() || form.opcoes.filter(o => o.trim()).length < 2}
              >
                {editingEnquete ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="lista" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lista">Lista de Enquetes</TabsTrigger>
          <TabsTrigger value="relatorio">Relatório de Desempenho</TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-6">
          {isLoadingAll ? (
            <div className="text-center py-8">Carregando enquetes...</div>
          ) : (
            <div className="grid gap-6">
              {enquetes?.map((enquete) => (
                <Card key={enquete.id} className={`${isActive(enquete) ? 'border-primary/20 bg-primary/5' : ''}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Vote className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">{enquete.titulo}</CardTitle>
                          {isActive(enquete) ? (
                            <Badge variant="default">
                              <Eye className="h-3 w-3 mr-1" />
                              Ativa
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Inativa
                            </Badge>
                          )}
                        </div>
                        
                        {enquete.descricao && (
                          <p className="text-sm text-muted-foreground mb-2">{enquete.descricao}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(enquete.data_inicio)}
                          </span>
                          {enquete.data_fim && (
                            <span>até {formatDate(enquete.data_fim)}</span>
                          )}
                          <span className="flex items-center">
                            <BarChart3 className="h-3 w-3 mr-1" />
                            {enquete.multipla_escolha ? 'Múltipla escolha' : 'Escolha única'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(enquete)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta enquete? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => excluirEnquete.mutate(enquete.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium">Opções:</h4>
                      <ul className="space-y-1">
                        {enquete.opcoes.map((opcao, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            {index + 1}. {opcao}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {(!enquetes || enquetes.length === 0) && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Vote className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma enquete encontrada</h3>
                    <p className="text-muted-foreground text-center">
                      Crie sua primeira enquete para começar a coletar opiniões dos usuários.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="relatorio" className="space-y-6">
          {enqueteAtiva ? (
            <div className="space-y-6">
              {/* Estatísticas Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{enqueteAtiva.total_votos}</p>
                        <p className="text-sm text-muted-foreground">Total de Votos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{enqueteAtiva.opcoes.length}</p>
                        <p className="text-sm text-muted-foreground">Opções Disponíveis</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">
                          {enqueteAtiva.multipla_escolha ? 'Múltipla' : 'Única'}
                        </p>
                        <p className="text-sm text-muted-foreground">Tipo de Escolha</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detalhes da Enquete Ativa */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Vote className="h-5 w-5" />
                    <span>{enqueteAtiva.titulo}</span>
                  </CardTitle>
                  {enqueteAtiva.descricao && (
                    <p className="text-sm text-muted-foreground">{enqueteAtiva.descricao}</p>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <h4 className="font-semibold text-lg">Resultados por Opção:</h4>
                  
                  {enqueteAtiva.opcoes.map((opcao, index) => {
                    const percentage = getPercentage(index);
                    const votes = getVotes(index);
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{opcao}</span>
                          <div className="text-right">
                            <span className="font-bold">{votes} votos</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-3" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma enquete ativa</h3>
                <p className="text-muted-foreground text-center">
                  Não há enquetes ativas no momento para gerar relatórios.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};