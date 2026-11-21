import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCategoriasProblema } from '@/hooks/useProblemasCidade';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, CheckCircle, XCircle, Trash2, AlertCircle } from 'lucide-react';

export const ProblemasCidadeSection = () => {
  const { categorias } = useCategoriasProblema();
  const [problemaModal, setProblemaModal] = useState<any>(null);
  const [statusSelecionado, setStatusSelecionado] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [tituloEdit, setTituloEdit] = useState('');
  const [descricaoEdit, setDescricaoEdit] = useState('');
  const [enderecoEdit, setEnderecoEdit] = useState('');
  const [bairroEdit, setBairroEdit] = useState('');
  const [prioridadeEdit, setPrioridadeEdit] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'pendente' | 'aprovado' | 'rejeitado' | 'todos'>('pendente');
  const [processing, setProcessing] = useState(false);
  
  // Query customizada para admin ver TODAS as reclamações
  const { data: problemas, isLoading, isError, refetch } = useQuery({
    queryKey: ['problemas-cidade-admin', filtroStatus],
    queryFn: async () => {
      let query = supabase
        .from('problemas_cidade')
        .select(`
          *,
          categoria:categorias_problema(nome, icone, cor),
          usuario:usuarios(nome)
        `)
        .eq('ativo', true);

      if (filtroStatus !== 'todos') {
        query = query.eq('status_aprovacao', filtroStatus);
      }

      query = query.order('criado_em', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const queryClient = useQueryClient();
  
  const saveModeration = async (
    changes: Record<string, unknown>,
    successMessage: string,
    expectedStatus?: 'pendente' | 'aprovado' | 'rejeitado',
  ) => {
    if (!problemaModal || processing) return;
    setProcessing(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Sua sessão expirou.');
      let query = supabase
        .from('problemas_cidade')
        .update(changes)
        .eq('id', problemaModal.id);
      if (expectedStatus) query = query.eq('status_aprovacao', expectedStatus);
      const { data, error } = await query.select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('A reclamação já foi alterada ou você não tem permissão.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['problemas-cidade-admin'] }),
        queryClient.invalidateQueries({ queryKey: ['problemas-cidade'] }),
        queryClient.invalidateQueries({ queryKey: ['problema-detalhes'] }),
      ]);
      toast.success(successMessage);
      setProblemaModal(null);
      setObservacoes('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar a moderação.');
    } finally {
      setProcessing(false);
    }
  };

  const handleAprovar = () => void saveModeration({
    status_aprovacao: 'aprovado',
    data_aprovacao: new Date().toISOString(),
    observacoes_moderacao: observacoes,
  }, 'Reclamação aprovada com sucesso', 'pendente');

  const handleRejeitar = () => void saveModeration({
    status_aprovacao: 'rejeitado',
    data_aprovacao: new Date().toISOString(),
    observacoes_moderacao: observacoes,
  }, 'Reclamação rejeitada', 'pendente');

  const handleAtualizarReclamacao = () => void saveModeration({
    titulo: tituloEdit,
    descricao: descricaoEdit,
    endereco: enderecoEdit,
    bairro: bairroEdit,
    prioridade: prioridadeEdit as 'baixa' | 'media' | 'alta' | 'urgente',
    status: statusSelecionado as 'aberto' | 'em_analise' | 'resolvido' | 'fechado',
    moderado: true,
    data_moderacao: new Date().toISOString(),
    observacoes_moderacao: observacoes,
  }, 'Reclamação atualizada com sucesso');

  const handleExcluir = async (id: string) => {
    if (processing || !confirm('Tem certeza que deseja excluir esta reclamação?')) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase
        .from('problemas_cidade')
        .update({ ativo: false })
        .eq('id', id)
        .eq('ativo', true)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Reclamação já removida ou sem permissão.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['problemas-cidade-admin'] }),
        queryClient.invalidateQueries({ queryKey: ['problemas-cidade'] }),
        queryClient.invalidateQueries({ queryKey: ['problema-detalhes'] }),
      ]);
      toast.success('Reclamação removida da lista.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível remover a reclamação.');
    } finally {
      setProcessing(false);
    }
  };

  const statusAprovacaoColors = {
    pendente: 'bg-yellow-500/10 text-yellow-500',
    aprovado: 'bg-green-500/10 text-green-500',
    rejeitado: 'bg-red-500/10 text-red-500',
  };

  const statusAprovacaoLabels = {
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    rejeitado: 'Rejeitado',
  };

  const statusColors = {
    aberto: 'bg-red-500/10 text-red-500',
    em_analise: 'bg-yellow-500/10 text-yellow-500',
    resolvido: 'bg-green-500/10 text-green-500',
    fechado: 'bg-gray-500/10 text-gray-500',
  };

  const statusLabels = {
    aberto: 'Aberto',
    em_analise: 'Em Análise',
    resolvido: 'Resolvido',
    fechado: 'Fechado',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Voz do Povo</h2>
        <p className="text-muted-foreground">
          Gerencie e modere as reclamações relatadas pelos cidadãos
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Reclamações</CardTitle>
          <Select value={filtroStatus} onValueChange={(value: any) => setFiltroStatus(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="aprovado">Aprovadas</SelectItem>
              <SelectItem value="rejeitado">Rejeitadas</SelectItem>
              <SelectItem value="todos">Todas</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : isError ? (
            <div role="alert" className="space-y-3 py-8 text-center"><p>Não foi possível carregar as reclamações.</p><Button variant="outline" onClick={() => { void refetch(); }}>Tentar novamente</Button></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Aprovação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Votos</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {problemas?.map((problema) => (
                  <TableRow key={problema.id}>
                    <TableCell className="font-medium">{problema.titulo}</TableCell>
                    <TableCell>
                      {problema.categoria?.nome || 'Sem categoria'}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusAprovacaoColors[problema.status_aprovacao]}>
                        {statusAprovacaoLabels[problema.status_aprovacao]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[problema.status]}>
                        {statusLabels[problema.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          problema.prioridade === 'urgente'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {problema.prioridade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {problema.votos_positivos - problema.votos_negativos}
                    </TableCell>
                    <TableCell>
                      {format(new Date(problema.criado_em), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setProblemaModal(problema);
                            setStatusSelecionado(problema.status);
                            setTituloEdit(problema.titulo);
                            setDescricaoEdit(problema.descricao);
                            setEnderecoEdit(problema.endereco);
                            setBairroEdit(problema.bairro || '');
                            setPrioridadeEdit(problema.prioridade);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { void handleExcluir(problema.id); }} disabled={processing}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes/Moderação */}
      <Dialog open={!!problemaModal} onOpenChange={() => setProblemaModal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Moderar Reclamação</DialogTitle>
          </DialogHeader>

          {problemaModal && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-2">Status de Aprovação</h3>
                  <Badge className={statusAprovacaoColors[problemaModal.status_aprovacao]}>
                    {statusAprovacaoLabels[problemaModal.status_aprovacao]}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Título</h3>
                <Input
                  value={tituloEdit}
                  onChange={(e) => setTituloEdit(e.target.value)}
                  placeholder="Título da reclamação"
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <Textarea
                  value={descricaoEdit}
                  onChange={(e) => setDescricaoEdit(e.target.value)}
                  placeholder="Descrição detalhada"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Endereço</h3>
                  <Input
                    value={enderecoEdit}
                    onChange={(e) => setEnderecoEdit(e.target.value)}
                    placeholder="Endereço"
                  />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Bairro</h3>
                  <Input
                    value={bairroEdit}
                    onChange={(e) => setBairroEdit(e.target.value)}
                    placeholder="Bairro"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Status</h3>
                  <Select value={statusSelecionado} onValueChange={setStatusSelecionado}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aberto">Aberto</SelectItem>
                      <SelectItem value="em_analise">Em Análise</SelectItem>
                      <SelectItem value="resolvido">Resolvido</SelectItem>
                      <SelectItem value="fechado">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Prioridade</h3>
                  <Select value={prioridadeEdit} onValueChange={setPrioridadeEdit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Observações de Moderação</h3>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Adicione observações sobre a moderação..."
                  rows={3}
                />
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setProblemaModal(null)}>
                  Cancelar
                </Button>
                {problemaModal.status_aprovacao === 'pendente' && (
                  <>
                    <Button variant="destructive" onClick={handleRejeitar} disabled={processing}>
                      Rejeitar
                    </Button>
                    <Button onClick={handleAprovar} disabled={processing}>
                      Aprovar
                    </Button>
                  </>
                )}
                {problemaModal.status_aprovacao !== 'pendente' && (
                  <Button onClick={handleAtualizarReclamacao} disabled={processing}>
                    Salvar Alterações
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
