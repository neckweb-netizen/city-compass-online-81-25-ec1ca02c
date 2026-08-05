import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Plus, Trash2, Edit3, Send, CheckCircle2, Clock, 
  AlertCircle, Search, DollarSign, UserCheck, Calendar, Sparkles, Filter 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RegistroCobranca {
  id: string;
  cliente: string;
  telefone: string;
  valor: string;
  descricao: string;
  vencimento: string;
  chavePix: string;
  status: 'pendente' | 'pago' | 'atrasado';
  observacoes: string;
  criadoEm: string;
}

export const GestaoCobrancas = () => {
  const navigate = useNavigate();

  // ESTADO DOS REGISTROS (Salvos no LocalStorage do navegador do usuário)
  const [cobrancas, setCobrancas] = useState<RegistroCobranca[]>(() => {
    const salvos = localStorage.getItem('@sajtem:cobrancas');
    return salvos ? JSON.parse(salvos) : [];
  });

  // FORMULÁRIO DE CADASTRO/EDIÇÃO
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [cliente, setCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [status, setStatus] = useState<'pendente' | 'pago' | 'atrasado'>('pendente');
  const [observacoes, setObservacoes] = useState('');

  // FILTROS E BUSCA
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  // SALVAR NO LOCALSTORAGE SEMPRE QUE HOUVER ALTERAÇÃO
  useEffect(() => {
    localStorage.setItem('@sajtem:cobrancas', JSON.stringify(cobrancas));
  }, [cobrancas]);

  // FORMATAÇÃO DE MOEDA
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (!value) {
      setValor('');
      return;
    }
    const valorNumerico = (parseFloat(value) / 100).toFixed(2);
    setValor(valorNumerico.replace('.', ','));
  };

  // FORMATAÇÃO DE TELEFONE
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 2) value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    if (value.length > 9) value = `${value.slice(0, 10)}-${value.slice(10)}`;
    setTelefone(value);
  };

  // ADICIONAR OU ATUALIZAR REGISTRO
  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cliente.trim() || !valor.trim()) {
      alert('Por favor, preencha o nome do cliente e o valor.');
      return;
    }

    if (editandoId) {
      setCobrancas(cobrancas.map(item => item.id === editandoId ? {
        ...item,
        cliente,
        telefone,
        valor,
        descricao,
        vencimento,
        chavePix,
        status,
        observacoes
      } : item));
      setEditandoId(null);
    } else {
      const novoRegistro: RegistroCobranca = {
        id: Date.now().toString(),
        cliente,
        telefone,
        valor,
        descricao,
        vencimento,
        chavePix,
        status,
        observacoes,
        criadoEm: new Date().toLocaleDateString('pt-BR')
      };
      setCobrancas([novoRegistro, ...cobrancas]);
    }

    limparFormulario();
  };

  // LIMPAR FORMULÁRIO
  const limparFormulario = () => {
    setEditandoId(null);
    setCliente('');
    setTelefone('');
    setValor('');
    setDescricao('');
    setVencimento('');
    setChavePix('');
    setStatus('pendente');
    setObservacoes('');
  };

  // CARREGAR DADOS PARA EDIÇÃO
  const handleEditar = (item: RegistroCobranca) => {
    setEditandoId(item.id);
    setCliente(item.cliente);
    setTelefone(item.telefone);
    setValor(item.valor);
    setDescricao(item.descricao);
    setVencimento(item.vencimento);
    setChavePix(item.chavePix);
    setStatus(item.status);
    setObservacoes(item.observacoes);
  };

  // EXCLUIR REGISTRO
  const handleExcluir = (id: string) => {
    if (confirm('Deseja realmente excluir esta anotação?')) {
      setCobrancas(cobrancas.filter(item => item.id !== id));
    }
  };

  // ALTERAR STATUS RÁPIDO
  const handleMudarStatus = (id: string, novoStatus: 'pendente' | 'pago' | 'atrasado') => {
    setCobrancas(cobrancas.map(item => item.id === id ? { ...item, status: novoStatus } : item));
  };

  // ENVIAR COBRANÇA DIRETO NO WHATSAPP
  const handleEnviarWhatsApp = (item: RegistroCobranca) => {
    const numLimpo = item.telefone.replace(/\D/g, '');
    const dataFormatada = item.vencimento ? item.vencimento.split('-').reverse().join('/') : 'A combinar';
    
    let mensagem = `Olá, *${item.cliente}*! Tudo bem?\n\nPassando para lembrar do valor de *R$ ${item.valor}* referente a *${item.descricao || 'serviços/produtos'}*, com vencimento em *${dataFormatada}*.`;
    
    if (item.chavePix) {
      mensagem += `\n\n🔑 *Chave PIX:* \`${item.chavePix}\``;
    }

    mensagem += `\n\nQualquer dúvida, estou à disposição! 🙏`;

    const url = numLimpo 
      ? `https://wa.me/55${numLimpo}?text=${encodeURIComponent(mensagem)}`
      : `https://wa.me/?text=${encodeURIComponent(mensagem)}`;

    window.open(url, '_blank');
  };

  // CÁLCULOS TOTAIS DOS CARDS
  const totalRecebido = cobrancas
    .filter(i => i.status === 'pago')
    .reduce((acc, curr) => acc + (parseFloat(curr.valor.replace('.', '').replace(',', '.')) || 0), 0);

  const totalPendente = cobrancas
    .filter(i => i.status === 'pendente')
    .reduce((acc, curr) => acc + (parseFloat(curr.valor.replace('.', '').replace(',', '.')) || 0), 0);

  const totalAtrasado = cobrancas
    .filter(i => i.status === 'atrasado')
    .reduce((acc, curr) => acc + (parseFloat(curr.valor.replace('.', '').replace(',', '.')) || 0), 0);

  // FILTRAGEM DOS REGISTROS
  const cobrancasFiltradas = cobrancas.filter(item => {
    const bateBusca = item.cliente.toLowerCase().includes(termoBusca.toLowerCase()) ||
                      item.descricao.toLowerCase().includes(termoBusca.toLowerCase());
    const bateStatus = filtroStatus === 'todos' || item.status === filtroStatus;
    return bateBusca && bateStatus;
  });

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Gestão Pessoal
          </span>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Caderno & Gestão de Cobranças
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Anote suas contas a receber, controle status de pagamentos e cobre clientes via WhatsApp em um só lugar.
          </p>
        </div>

        {/* CARDS DE RESUMO FINANCEIRO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600 font-bold uppercase">Total Recebido</p>
                <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  R$ {totalRecebido.toFixed(2).replace('.', ',')}
                </h3>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-80" />
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-600 font-bold uppercase">A Receber (Pendente)</p>
                <h3 className="text-2xl font-black text-amber-700 dark:text-amber-400">
                  R$ {totalPendente.toFixed(2).replace('.', ',')}
                </h3>
              </div>
              <Clock className="w-8 h-8 text-amber-500 opacity-80" />
            </CardContent>
          </Card>

          <Card className="border-rose-500/20 bg-rose-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-rose-600 font-bold uppercase">Atrasado</p>
                <h3 className="text-2xl font-black text-rose-700 dark:text-rose-400">
                  R$ {totalAtrasado.toFixed(2).replace('.', ',')}
                </h3>
              </div>
              <AlertCircle className="w-8 h-8 text-rose-500 opacity-80" />
            </CardContent>
          </Card>
        </div>

        {/* FORMULÁRIO E LISTAGEM */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* FORMULÁRIO (1 COLUNA) */}
          <Card className="border-border/60 shadow-lg h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center justify-between">
                <span>{editandoId ? 'Editar Anotação' : 'Nova Anotação'}</span>
                {editandoId && (
                  <Button size="sm" variant="ghost" onClick={limparFormulario} className="text-xs h-7">
                    Cancelar
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                Registre detalhes de novos serviços ou vendas a receber
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSalvar} className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold">Cliente *</Label>
                  <Input 
                    placeholder="Ex: Maria de Jesus" 
                    value={cliente} 
                    onChange={e => setCliente(e.target.value)} 
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs font-semibold">Valor (R$) *</Label>
                    <Input 
                      placeholder="0,00" 
                      value={valor} 
                      onChange={handleValorChange} 
                      className="h-9 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Status</Label>
                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">WhatsApp do Cliente</Label>
                  <Input 
                    placeholder="Ex: (75) 99999-9999" 
                    value={telefone} 
                    onChange={handleTelefoneChange} 
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs font-semibold">Vencimento</Label>
                    <Input 
                      type="date" 
                      value={vencimento} 
                      onChange={e => setVencimento(e.target.value)} 
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Sua Chave PIX</Label>
                    <Input 
                      placeholder="CPF / Tel / E-mail" 
                      value={chavePix} 
                      onChange={e => setChavePix(e.target.value)} 
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Descrição do Serviço / Produto</Label>
                  <Input 
                    placeholder="Ex: Concerto de Celular / Venda de Peça" 
                    value={descricao} 
                    onChange={e => setDescricao(e.target.value)} 
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Anotações Internas / Observações</Label>
                  <Textarea 
                    placeholder="Ex: Cliente disse que vai pagar no próximo sábado..." 
                    value={observacoes} 
                    onChange={e => setObservacoes(e.target.value)} 
                    className="text-xs h-16"
                  />
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-bold h-10 text-xs rounded-xl gap-2 mt-2">
                  <Plus className="w-4 h-4" />
                  {editandoId ? 'Atualizar Anotação' : 'Salvar no Caderno'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* LISTAGEM E REGISTROS (2 COLUNAS) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* BARRA DE BUSCA E FILTROS */}
            <Card className="border-border/60 shadow-sm p-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por cliente ou descrição..." 
                    value={termoBusca} 
                    onChange={e => setTermoBusca(e.target.value)} 
                    className="pl-9 h-9 text-xs"
                  />
                </div>
                <div className="w-full sm:w-40">
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Filtrar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Status</SelectItem>
                      <SelectItem value="pendente">Pendentes</SelectItem>
                      <SelectItem value="pago">Pagos</SelectItem>
                      <SelectItem value="atrasado">Atrasados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* LISTA DE ANOTAÇÕES */}
            {cobrancasFiltradas.length === 0 ? (
              <Card className="border-dashed border-border/80 p-8 text-center space-y-2">
                <UserCheck className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
                <h3 className="font-bold text-sm text-foreground">Nenhuma anotação encontrada</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Cadastre sua primeira cobrança no formulário ao lado para começar o acompanhamento.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {cobrancasFiltradas.map((item) => (
                  <Card key={item.id} className="border-border/60 shadow-sm hover:border-primary/40 transition-all">
                    <CardContent className="p-4 space-y-3">
                      
                      {/* TOPO DO CARD DA ANOTAÇÃO */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-foreground">{item.cliente}</h3>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] uppercase font-bold ${
                                item.status === 'pago' 
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                                  : item.status === 'atrasado' 
                                  ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' 
                                  : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                              }`}
                            >
                              {item.status}
                            </Badge>
                          </div>
                          {item.descricao && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.descricao}</p>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-black text-foreground">R$ {item.valor}</span>
                          {item.vencimento && (
                            <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                              <Calendar className="w-3 h-3" /> Vence: {item.vencimento.split('-').reverse().join('/')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* OBSERVAÇÕES SE HOUVER */}
                      {item.observacoes && (
                        <div className="p-2 bg-muted/30 rounded-lg text-xs text-muted-foreground border border-border/40">
                          <strong>Anotação:</strong> {item.observacoes}
                        </div>
                      )}

                      {/* BARRA DE AÇÕES RÁPIDAS */}
                      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border/40 gap-2">
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleMudarStatus(item.id, 'pago')}
                            className="h-7 text-[10px] text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                          >
                            Marcar Pago
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleMudarStatus(item.id, 'atrasado')}
                            className="h-7 text-[10px] text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                          >
                            Marcar Atrasado
                          </Button>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            onClick={() => handleEnviarWhatsApp(item)}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 rounded-lg"
                          >
                            <Send className="w-3 h-3" /> WhatsApp
                          </Button>

                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleEditar(item)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>

                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleExcluir(item.id)}
                            className="h-7 w-7 text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};

export default GestaoCobrancas;
