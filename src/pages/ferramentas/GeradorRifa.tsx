import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Ticket, Trophy, QrCode, Sparkles, Copy, Trash2, Calendar, Clock, Share2, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface NumeroRifa {
  numero: string;
  status: 'livre' | 'reservado' | 'pago';
  nome?: string;
  telefone?: string;
}

export const GeradorRifa = () => {
  const navigate = useNavigate();

  // DADOS DA RIFA
  const [titulo, setTitulo] = useState('');
  const [premio, setPremio] = useState('');
  const [valorNumero, setValorNumero] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [dataSorteio, setDataSorteio] = useState('');
  const [horaSorteio, setHoraSorteio] = useState('');
  const [qtdNumeros, setQtdNumeros] = useState<'50' | '100' | '1000'>('100');
  const [rifaCriada, setRifaCriada] = useState(false);

  // ESTADO DOS NÚMEROS
  const [numeros, setNumeros] = useState<NumeroRifa[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'livre' | 'reservado' | 'pago'>('todos');

  // MODAIS E SELEÇÕES
  const [numeroSelecionado, setNumeroSelecionado] = useState<NumeroRifa | null>(null);
  const [modalReservaOpen, setModalReservaOpen] = useState(false);
  const [nomeComprador, setNomeComprador] = useState('');
  const [telefoneComprador, setTelefoneComprador] = useState('');

  // CRIAR OU REINICIAR RIFA
  const handleCriarRifa = (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo || !premio || !valorNumero || !dataSorteio || !horaSorteio) {
      toast.error('Preencha todos os campos obrigatórios (Título, Prêmio, Valor, Data e Horário)');
      return;
    }

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

    setNumeros(lista);
    setRifaCriada(true);
    toast.success('Rifa criada com sucesso! Você já pode gerenciar os números e compartilhar o link.');
  };

  // SELEÇÃO DE NÚMERO NA GRADE
  const handleAbrirReserva = (item: NumeroRifa) => {
    setNumeroSelecionado(item);
    setNomeComprador(item.nome || '');
    setTelefoneComprador(item.telefone || '');
    setModalReservaOpen(true);
  };

  // SALVAR RESERVA / ATUALIZAR STATUS
  const handleSalvarReserva = (novoStatus: 'reservado' | 'pago') => {
    if (!numeroSelecionado) return;
    if (!nomeComprador.trim()) {
      toast.error('Informe o nome do comprador.');
      return;
    }

    setNumeros(prev => prev.map(item => {
      if (item.numero === numeroSelecionado.numero) {
        return {
          ...item,
          status: novoStatus,
          nome: nomeComprador,
          telefone: telefoneComprador,
        };
      }
      return item;
    }));

    setModalReservaOpen(false);
    toast.success(`Número ${numeroSelecionado.numero} marcado como ${novoStatus.toUpperCase()}!`);
  };

  // LIBERAR NÚMERO
  const handleLiberarNumero = () => {
    if (!numeroSelecionado) return;

    setNumeros(prev => prev.map(item => {
      if (item.numero === numeroSelecionado.numero) {
        return {
          numero: item.numero,
          status: 'livre',
        };
      }
      return item;
    }));

    setModalReservaOpen(false);
    toast.info(`Número ${numeroSelecionado.numero} liberado para venda novamente.`);
  };

  // COPIAR LINK DE COMPARTILHAMENTO DA RIFA
  const handleCopiarLinkRifa = () => {
    const linkBase = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      titulo,
      premio,
      valor: valorNumero,
      data: dataSorteio,
      hora: horaSorteio,
    });

    const linkFinal = `${linkBase}?${params.toString()}`;

    navigator.clipboard.writeText(linkFinal);
    toast.success('Link da Rifa copiado com sucesso! Agora você pode compartilhar.');
  };

  // ESTATÍSTICAS
  const totalPagos = numeros.filter(n => n.status === 'pago').length;
  const totalReservados = numeros.filter(n => n.status === 'reservado').length;
  const totalLivres = numeros.filter(n => n.status === 'livre').length;
  const arrecadacaoTotal = totalPagos * (parseFloat(valorNumero.replace(',', '.')) || 0);

  const numerosFiltrados = numeros.filter(n => {
    if (filtroStatus === 'todos') return true;
    return n.status === filtroStatus;
  });

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
            Crie sua rifa personalizada, defina data e horário do sorteio e compartilhe o link direto com os compradores.
          </p>
        </div>

        {!rifaCriada ? (
          /* FORMULÁRIO DE CRIAÇÃO DA RIFA */
          <Card className="max-w-2xl mx-auto border-border/60 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" /> Configurar Nova Rifa
              </CardTitle>
              <CardDescription className="text-xs">
                Informe os dados do prêmio, valores e a data do sorteio
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

                {/* DATA E HORÁRIO DO SORTEIO */}
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

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 rounded-xl gap-2 mt-2">
                  <Sparkles className="w-4 h-4" /> Gerar Tabela e Link da Rifa
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* PAINEL DE GESTÃO DA RIFA */
          <div className="space-y-6">

            {/* CARD DE INFORMAÇÕES E RESUMO COM DATA E LINK COPIÁVEL */}
            <Card className="border-border/60 shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-primary border-primary/30 text-[10px] uppercase font-bold mb-1">
                      Rifa Ativa ({qtdNumeros} números)
                    </Badge>
                    <h2 className="text-2xl font-black text-foreground">{titulo}</h2>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-amber-500 shrink-0" /> Prêmio: <strong className="text-foreground">{premio}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-primary shrink-0" /> Data: <strong className="text-foreground">{dataSorteio.split('-').reverse().join('/')}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-primary shrink-0" /> Hora: <strong className="text-foreground">{horaSorteio}h</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* BOTÃO COPIAR LINK DA RIFA */}
                    <Button 
                      onClick={handleCopiarLinkRifa} 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-4 rounded-xl gap-2 shadow-sm text-xs"
                    >
                      <Share2 className="w-4 h-4" /> Copiar Link da Rifa
                    </Button>

                    <Button 
                      variant="outline" 
                      onClick={() => setRifaCriada(false)}
                      className="h-10 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Nova Rifa
                    </Button>
                  </div>
                </div>

                {/* PAINEL DE MÉTRICAS DE ARRECADAÇÃO */}
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
                      <span>Chave PIX para Cobrança: <strong>{chavePix}</strong></span>
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

            {/* CONTROLES E GRADE DOS NÚMEROS */}
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold">Grade de Números</CardTitle>
                  <CardDescription className="text-xs">Clique no número para marcar como Reservado, Pago ou Liberar</CardDescription>
                </div>

                {/* FILTROS DE VISUALIZAÇÃO */}
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
                {/* GRADE INTERATIVA DE NÚMEROS */}
                <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-12 gap-2 max-h-[500px] overflow-y-auto p-1">
                  {numerosFiltrados.map((item) => {
                    let estilos = 'bg-background hover:border-primary/60 text-foreground border-border';
                    if (item.status === 'reservado') estilos = 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 font-bold';
                    if (item.status === 'pago') estilos = 'bg-emerald-500 text-white border-emerald-600 font-extrabold shadow-sm';

                    return (
                      <button
                        key={item.numero}
                        onClick={() => handleAbrirReserva(item)}
                        className={`h-10 rounded-xl border text-xs sm:text-sm transition-all duration-150 flex flex-col items-center justify-center relative group ${estilos}`}
                        title={item.nome ? `${item.nome} (${item.status})` : `Número ${item.numero}`}
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

                {/* LEGENDA DE CORES */}
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

      {/* MODAL DE ATUALIZAÇÃO / RESERVA DE NÚMERO */}
      <Dialog open={modalReservaOpen} onOpenChange={setModalReservaOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Ticket className="w-5 h-5 text-primary" /> Número {numeroSelecionado?.numero}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Cadastre os dados do comprador para reservar ou marcar como pago.
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
