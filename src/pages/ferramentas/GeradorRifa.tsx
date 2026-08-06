import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Ticket, Trophy, QrCode, Sparkles, Copy, Trash2, Calendar, Clock, Share2, AlertTriangle, PlusCircle, ListFilter, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NumeroRifa {
  numero: string;
  status: 'livre' | 'reservado' | 'pago';
  nome?: string;
  telefone?: string;
}

interface RifaDados {
  id?: string;
  user_id?: string;
  titulo: string;
  premio: string;
  valor_numero: string;
  chave_pix: string;
  data_sorteio: string;
  hora_sorteio: string;
  qtd_numeros: '50' | '100' | '1000';
  numeros: NumeroRifa[];
  created_at?: string;
}

export const GeradorRifa = () => {
  const navigate = useNavigate();

  // DADOS DO FORMULÁRIO
  const [titulo, setTitulo] = useState('');
  const [premio, setPremio] = useState('');
  const [valorNumero, setValorNumero] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [dataSorteio, setDataSorteio] = useState('');
  const [horaSorteio, setHoraSorteio] = useState('');
  const [qtdNumeros, setQtdNumeros] = useState<'50' | '100' | '1000'>('100');

  // ESTADOS DO BANCO DE DADOS
  const [rifasUsuario, setRifasUsuario] = useState<RifaDados[]>([]);
  const [rifaAtiva, setRifaAtiva] = useState<RifaDados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // ABA ATIVA: 'minhas' OU 'criar'
  const [abaExibicao, setAbaExibicao] = useState<'minhas' | 'criar'>('criar');

  // ESTADO DOS NÚMEROS E FILTROS
  const [numeros, setNumeros] = useState<NumeroRifa[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'livre' | 'reservado' | 'pago'>('todos');

  // MODAL
  const [numeroSelecionado, setNumeroSelecionado] = useState<NumeroRifa | null>(null);
  const [modalReservaOpen, setModalReservaOpen] = useState(false);
  const [nomeComprador, setNomeComprador] = useState('');
  const [telefoneComprador, setTelefoneComprador] = useState('');

  // 1. LIMPAR EXPIRADAS DO BANCO E BUSCAR RIFAS DO USUÁRIO
  const carregarRifasDoBanco = async () => {
    try {
      setCarregando(true);
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // Executa rotina de exclusão das expiradas há mais de 7 dias no Supabase
      await supabase.rpc('deletar_rifas_expiradas' as any);

      let query = supabase.from('rifas_usuarios' as any).select('*').order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        const listaFormatada: RifaDados[] = data.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          titulo: item.titulo,
          premio: item.premio,
          valor_numero: item.valor_numero,
          chave_pix: item.chave_pix,
          data_sorteio: item.data_sorteio,
          hora_sorteio: item.hora_sorteio,
          qtd_numeros: item.qtd_numeros,
          numeros: item.numeros || [],
          created_at: item.created_at
        }));

        setRifasUsuario(listaFormatada);
        selecionarRifaParaExibir(listaFormatada[0]);
        setAbaExibicao('minhas');
      } else {
        setRifasUsuario([]);
        setRifaAtiva(null);
        setAbaExibicao('criar');
      }
    } catch (err) {
      console.error('Erro ao carregar rifas do Supabase:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarRifasDoBanco();
  }, []);

  const selecionarRifaParaExibir = (rifa: RifaDados) => {
    setRifaAtiva(rifa);
    setNumeros(rifa.numeros || []);
    setTitulo(rifa.titulo);
    setPremio(rifa.premio);
    setValorNumero(rifa.valor_numero);
    setChavePix(rifa.chave_pix);
    setDataSorteio(rifa.data_sorteio);
    setHoraSorteio(rifa.hora_sorteio);
    setQtdNumeros(rifa.qtd_numeros);
  };

  // 2. CRIAR E SALVAR NOVA RIFA NO SUPABASE
  const handleCriarRifa = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo || !premio || !valorNumero || !dataSorteio || !horaSorteio) {
      toast.error('Preencha todos os campos obrigatórios (Título, Prêmio, Valor, Data e Horário)');
      return;
    }

    try {
      setSalvando(true);
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      const total = parseInt(qtdNumeros);
      const lista: NumeroRifa[] = [];

      for (let i = 0; i < total; i++) {
        const numFormatado = qtdNumeros === '1000' 
          ? i.toString().padStart(3, '0') 
          : i.toString().padStart(2, '0');

        lista.push({
          numero: numFormatado,
          status: 'livre',
        });
      }

      const { data, error } = await supabase
        .from('rifas_usuarios' as any)
        .insert({
          user_id: userId,
          titulo,
          premio,
          valor_numero: valorNumero,
          chave_pix: chavePix,
          data_sorteio: dataSorteio,
          hora_sorteio: horaSorteio,
          qtd_numeros: qtdNumeros,
          numeros: lista
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Rifa salva com sucesso no banco de dados!');
      await carregarRifasDoBanco();
    } catch (err: any) {
      toast.error('Erro ao salvar rifa no banco: ' + err.message);
    } finally {
      setSalvando(false);
    }
  };

  // 3. ATUALIZAR STATUS DE NÚMERO RESERVADO / PAGO NO BANCO DE DADOS
  const handleSalvarReserva = async (novoStatus: 'reservado' | 'pago') => {
    if (!numeroSelecionado || !rifaAtiva?.id) return;
    if (!nomeComprador.trim()) {
      toast.error('Informe o nome do comprador.');
      return;
    }

    const novosNumeros = numeros.map(item => {
      if (item.numero === numeroSelecionado.numero) {
        return {
          ...item,
          status: novoStatus,
          nome: nomeComprador,
          telefone: telefoneComprador,
        };
      }
      return item;
    });

    try {
      setNumeros(novosNumeros);

      const { error } = await supabase
        .from('rifas_usuarios' as any)
        .update({ numeros: novosNumeros })
        .eq('id', rifaAtiva.id);

      if (error) throw error;

      setRifaAtiva(prev => prev ? { ...prev, numeros: novosNumeros } : null);
      setModalReservaOpen(false);
      toast.success(`Número ${numeroSelecionado.numero} atualizado para ${novoStatus.toUpperCase()}!`);
    } catch (err: any) {
      toast.error('Erro ao atualizar número no banco: ' + err.message);
    }
  };

  // LIBERAR NÚMERO
  const handleLiberarNumero = async () => {
    if (!numeroSelecionado || !rifaAtiva?.id) return;

    const novosNumeros = numeros.map(item => {
      if (item.numero === numeroSelecionado.numero) {
        return {
          numero: item.numero,
          status: 'livre' as const,
        };
      }
      return item;
    });

    try {
      setNumeros(novosNumeros);

      const { error } = await supabase
        .from('rifas_usuarios' as any)
        .update({ numeros: novosNumeros })
        .eq('id', rifaAtiva.id);

      if (error) throw error;

      setRifaAtiva(prev => prev ? { ...prev, numeros: novosNumeros } : null);
      setModalReservaOpen(false);
      toast.info(`Número ${numeroSelecionado.numero} liberado novamente.`);
    } catch (err: any) {
      toast.error('Erro ao liberar número no banco: ' + err.message);
    }
  };

  // 4. APAGAR RIFA DO BANCO DE DADOS
  const handleApagarRifaManual = async () => {
    if (!rifaAtiva?.id) return;

    if (confirm('Tem certeza que deseja apagar esta rifa do banco de dados? Ela será removida permanentemente.')) {
      try {
        const { error } = await supabase
          .from('rifas_usuarios' as any)
          .delete()
          .eq('id', rifaAtiva.id);

        if (error) throw error;

        toast.success('Rifa excluída permanentemente do banco de dados.');
        await carregarRifasDoBanco();
      } catch (err: any) {
        toast.error('Erro ao apagar rifa do banco: ' + err.message);
      }
    }
  };

  const handleCopiarLinkRifa = () => {
    const linkBase = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      id: rifaAtiva?.id || '',
      titulo,
      premio,
      valor: valorNumero,
      data: dataSorteio,
      hora: horaSorteio,
    });

    const linkFinal = `${linkBase}?${params.toString()}`;
    navigator.clipboard.writeText(linkFinal);
    toast.success('Link da Rifa copiado para compartilhar!');
  };

  const totalPagos = numeros.filter(n => n.status === 'pago').length;
  const totalReservados = numeros.filter(n => n.status === 'reservado').length;
  const totalLivres = numeros.filter(n => n.status === 'livre').length;
  const arrecadacaoTotal = totalPagos * (parseFloat(valorNumero.replace(',', '.')) || 0);

  const numerosFiltrados = numeros.filter(n => {
    if (filtroStatus === 'todos') return true;
    return n.status === filtroStatus;
  });

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground font-semibold">Sincronizando com o banco de dados...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* CABEÇALHO */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Ações & Rifas
          </Badge>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight flex items-center justify-center gap-2">
            <Ticket className="w-8 h-8 text-primary" /> Gerador e Caderno de Rifas
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Crie sua rifa personalizada, acompanhe os pagamentos e salve no banco de dados com apaga automático pós-sorteio.
          </p>
        </div>

        {/* CONTROLES DE NAVEGAÇÃO DE ABAS */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {rifasUsuario.length > 0 && (
            <Button
              variant={abaExibicao === 'minhas' ? 'default' : 'outline'}
              onClick={() => setAbaExibicao('minhas')}
              className="rounded-full text-xs font-bold gap-2 px-5 h-9"
            >
              <ListFilter className="w-4 h-4" /> Minhas Rifas ({rifasUsuario.length})
            </Button>
          )}

          <Button
            variant={abaExibicao === 'criar' ? 'default' : 'outline'}
            onClick={() => {
              setTitulo('');
              setPremio('');
              setValorNumero('');
              setChavePix('');
              setDataSorteio('');
              setHoraSorteio('');
              setAbaExibicao('criar');
            }}
            className="rounded-full text-xs font-bold gap-2 px-5 h-9"
          >
            <PlusCircle className="w-4 h-4" /> Nova Rifa
          </Button>
        </div>

        {/* AVISO DE EXPIRAÇÃO AUTOMÁTICA EM 7 DIAS */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-700 dark:text-amber-400 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
          <span>
            <strong>Gestão do Banco de Dados:</strong> As rifas ficam salvas no banco de dados e são <strong>apagadas automaticamente 7 dias após a data do sorteio</strong>.
          </span>
        </div>

        {abaExibicao === 'criar' ? (
          /* FORMULÁRIO DE CRIAÇÃO DA RIFA */
          <Card className="max-w-2xl mx-auto border-border/60 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" /> Configurar Nova Rifa
              </CardTitle>
              <CardDescription className="text-xs">
                Informe os dados e salve a rifa diretamente no banco de dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCriarRifa} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Título / Nome da Rifa *</Label>
                  <Input 
                    placeholder="Ex: Rifa Beneficente do Saxofone ou Ação entre Amigos" 
                    value={titulo} 
                    onChange={e => setTitulo(e.target.value)} 
                    required 
                    className="h-10 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Prêmio Principal *</Label>
                    <Input 
                      placeholder="Ex: Cesta de Natal, R$ 500 no PIX, Smartphone" 
                      value={premio} 
                      onChange={e => setPremio(e.target.value)} 
                      required 
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Valor por Número (R$) *</Label>
                    <Input 
                      placeholder="Ex: 10,00" 
                      value={valorNumero} 
                      onChange={e => setValorNumero(e.target.value)} 
                      required 
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Data do Sorteio *</Label>
                    <Input 
                      type="date"
                      value={dataSorteio} 
                      onChange={e => setDataSorteio(e.target.value)} 
                      required 
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Horário do Sorteio *</Label>
                    <Input 
                      type="time"
                      value={horaSorteio} 
                      onChange={e => setHoraSorteio(e.target.value)} 
                      required 
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Quantidade de Números</Label>
                    <Select value={qtdNumeros} onValueChange={(v: '50' | '100' | '1000') => setQtdNumeros(v)}>
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">00 a 49 (50 Números)</SelectItem>
                        <SelectItem value="100">00 a 99 (100 Números)</SelectItem>
                        <SelectItem value="1000">000 a 999 (1.000 Números)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Chave PIX (Opcional)</Label>
                    <Input 
                      placeholder="CPF, Telefone ou E-mail para pagamento" 
                      value={chavePix} 
                      onChange={e => setChavePix(e.target.value)} 
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={salvando}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 rounded-xl gap-2 mt-2"
                >
                  {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{salvando ? 'Salvando Rifa...' : 'Salvar Rifa no Banco de Dados'}</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* PAINEL DE GESTÃO DA RIFA ATIVA */
          <div className="space-y-6">

            {/* SELETOR SE HOUVER MAIS DE UMA RIFA */}
            {rifasUsuario.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">Alternar Rifa:</span>
                {rifasUsuario.map(r => (
                  <Button
                    key={r.id}
                    variant={rifaAtiva?.id === r.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => selecionarRifaParaExibir(r)}
                    className="text-xs rounded-xl h-8 whitespace-nowrap"
                  >
                    {r.titulo}
                  </Button>
                ))}
              </div>
            )}

            <Card className="border-border/60 shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-primary border-primary/30 text-[10px] uppercase font-bold mb-1">
                        Rifa Ativa ({qtdNumeros} números)
                      </Badge>
                      <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-[10px] font-bold mb-1">
                        Auto-delete 7 dias pós-sorteio
                      </Badge>
                    </div>
                    <h2 className="text-2xl font-black text-foreground">{titulo}</h2>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-amber-500 shrink-0" /> Prêmio: <strong className="text-foreground">{premio}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-primary shrink-0" /> Data: <strong className="text-foreground">{dataSorteio ? dataSorteio.split('-').reverse().join('/') : '-'}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-primary shrink-0" /> Hora: <strong className="text-foreground">{horaSorteio}h</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button 
                      onClick={handleCopiarLinkRifa} 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-4 rounded-xl gap-2 shadow-sm text-xs"
                    >
                      <Share2 className="w-4 h-4" /> Copiar Link da Rifa
                    </Button>

                    <Button 
                      variant="outline" 
                      onClick={handleApagarRifaManual}
                      className="h-10 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Apagar Rifa do Banco
                    </Button>
                  </div>
                </div>

                {/* PAINEL DE MÉTRICAS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 bg-muted/40 rounded-xl border text-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Valor/Número</span>
                    <strong className="text-sm sm:text-base text-foreground font-extrabold">R$ {valorNumero}</strong>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold block">Pagos ({totalPagos})</span>
                    <strong className="text-sm sm:text-base text-emerald-600 dark:text-emerald-400 font-extrabold">R$ {arrecadacaoTotal.toFixed(2)}</strong>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-semibold block">Reservados</span>
                    <strong className="text-sm sm:text-base text-amber-600 dark:text-amber-400 font-extrabold">{totalReservados}</strong>
                  </div>
                  <div className="p-3 bg-muted/60 border rounded-xl text-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Disponíveis</span>
                    <strong className="text-sm sm:text-base text-foreground font-extrabold">{totalLivres}</strong>
                  </div>
                </div>

                {chavePix && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-primary shrink-0" />
                      <span>Chave PIX: <strong>{chavePix}</strong></span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs text-primary"
                      onClick={() => {
                        navigator.clipboard.writeText(chavePix);
                        toast.success('Chave PIX copiada!');
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copiar PIX
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* GRADE DE NÚMEROS */}
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold">Grade de Números</CardTitle>
                  <CardDescription className="text-xs">Clique no número para alterar comprador ou status</CardDescription>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['todos', 'livre', 'reservado', 'pago'] as const).map(st => (
                    <Button
                      key={st}
                      variant={filtroStatus === st ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFiltroStatus(st)}
                      className="text-[11px] h-7 px-2.5 capitalize rounded-lg"
                    >
                      {st}
                    </Button>
                  ))}
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-12 gap-2 max-h-[500px] overflow-y-auto p-1">
                  {numerosFiltrados.map((item) => {
                    let estilos = 'bg-background hover:border-primary/60 text-foreground border-border';
                    if (item.status === 'reservado') estilos = 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 font-bold';
                    if (item.status === 'pago') estilos = 'bg-emerald-500 text-white border-emerald-600 font-extrabold shadow-sm';

                    return (
                      <button
                        key={item.numero}
                        onClick={() => {
                          setNumeroSelecionado(item);
                          setNomeComprador(item.nome || '');
                          setTelefoneComprador(item.telefone || '');
                          setModalReservaOpen(true);
                        }}
                        className={`h-10 rounded-xl border text-xs sm:text-sm transition-all duration-150 flex flex-col items-center justify-center relative group ${estilos}`}
                      >
                        <span>{item.numero}</span>
                        {item.nome && (
                          <span className="text-[8px] truncate max-w-[90%] px-0.5 opacity-90 leading-tight">
                            {item.nome.split(' ')[0]}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-6 pt-6 text-xs text-muted-foreground border-t mt-6">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border border-border bg-background" />
                    <span>Livre</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500" />
                    <span>Reservado</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>Pago</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        )}

      </div>

      {/* MODAL DE RESERVA / PAGO */}
      <Dialog open={modalReservaOpen} onOpenChange={setModalReservaOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Ticket className="w-5 h-5 text-primary" /> Número {numeroSelecionado?.numero}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cadastre os dados do comprador para atualizar no banco
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nome do Comprador *</Label>
              <Input 
                placeholder="Ex: João da Silva" 
                value={nomeComprador} 
                onChange={e => setNomeComprador(e.target.value)} 
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">WhatsApp / Telefone</Label>
              <Input 
                placeholder="Ex: (75) 99999-9999" 
                value={telefoneComprador} 
                onChange={e => setTelefoneComprador(e.target.value)} 
                className="h-10 text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {numeroSelecionado?.status !== 'livre' && (
              <Button 
                variant="outline" 
                onClick={handleLiberarNumero}
                className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs h-9"
              >
                Liberar Número
              </Button>
            )}
            <Button 
              onClick={() => handleSalvarReserva('reservado')} 
              variant="outline"
              className="bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs h-9"
            >
              Marcar Reservado
            </Button>
            <Button 
              onClick={() => handleSalvarReserva('pago')} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9"
            >
              Marcar PAGO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default GeradorRifa;
