import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  AlertCircle,
  ArrowLeft,
  Calculator,
  CalendarDays,
  DollarSign,
  FileSpreadsheet,
  Landmark,
  MinusCircle,
  PlusCircle,
  RefreshCw,
  Sparkles,
  WalletCards,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ToolBanner } from '@/components/ferramentas/ToolBanner';

type MotivoRescisao = 'sem_justa_causa' | 'com_justa_causa' | 'pedido_demissao' | 'acordo';
type TipoAvisoPrevio = 'indenizado' | 'trabalhado' | 'nao_cumprido';

interface ResultadoRescisao {
  diasTrabalhadosMes: number;
  diasAvisoProporcional: number;
  avosDecimoTerceiro: number;
  avosFerias: number;
  anosCompletos: number;
  tempoServicoTexto: string;
  valorSaldoSalario: number;
  valorAvisoPrevio: number;
  valorDecimoTerceiro: number;
  valorFeriasProporcionais: number;
  valorTercoFeriasProporcionais: number;
  valorFeriasVencidas: number;
  valorTercoFeriasVencidas: number;
  saldoFgtsInformado: number;
  percentualMultaFgts: number;
  valorMultaFgts: number;
  descontoInssSaldo: number;
  descontoInssDecimoTerceiro: number;
  descontoAvisoPrevio: number;
  proventos: number;
  descontos: number;
  valorLiquidoRescisao: number;
  totalComMultaFgts: number;
}

const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

const parseMoeda = (valor: string) => {
  const normalizado = valor.trim().replace(/\s/g, '').replace(/R\$/gi, '');
  if (!normalizado) return 0;

  const usaVirgulaDecimal = normalizado.includes(',');
  const numero = usaVirgulaDecimal
    ? normalizado.replace(/\./g, '').replace(',', '.')
    : normalizado;

  return Number.parseFloat(numero) || 0;
};

const parseDataLocal = (valor: string) => {
  const [ano, mes, dia] = valor.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
};

const diferencaEmDias = (inicio: Date, fim: Date) =>
  Math.floor((fim.getTime() - inicio.getTime()) / 86_400_000) + 1;

const calcularInss2026 = (base: number) => {
  const faixas = [
    { limite: 1621, aliquota: 0.075 },
    { limite: 2902.84, aliquota: 0.09 },
    { limite: 4354.27, aliquota: 0.12 },
    { limite: 8475.55, aliquota: 0.14 },
  ];

  let contribuicao = 0;
  let limiteAnterior = 0;
  const baseLimitada = Math.min(Math.max(base, 0), faixas.at(-1)?.limite ?? 0);

  for (const faixa of faixas) {
    if (baseLimitada <= limiteAnterior) break;
    const parcela = Math.min(baseLimitada, faixa.limite) - limiteAnterior;
    contribuicao += parcela * faixa.aliquota;
    limiteAnterior = faixa.limite;
  }

  return contribuicao;
};

const contarAvosDecimoTerceiro = (admissao: Date, demissao: Date) => {
  const inicioAno = new Date(demissao.getFullYear(), 0, 1);
  const inicio = admissao > inicioAno ? admissao : inicioAno;
  let avos = 0;

  for (let mes = inicio.getMonth(); mes <= demissao.getMonth(); mes += 1) {
    const inicioMes = new Date(demissao.getFullYear(), mes, 1);
    const fimMes = new Date(demissao.getFullYear(), mes + 1, 0);
    const inicioTrabalhado = inicio > inicioMes ? inicio : inicioMes;
    const fimTrabalhado = demissao < fimMes ? demissao : fimMes;

    if (fimTrabalhado >= inicioTrabalhado && diferencaEmDias(inicioTrabalhado, fimTrabalhado) >= 15) {
      avos += 1;
    }
  }

  return Math.min(12, avos);
};

const contarAvosFerias = (admissao: Date, demissao: Date) => {
  let inicioPeriodo = new Date(demissao.getFullYear(), admissao.getMonth(), admissao.getDate());
  if (inicioPeriodo > demissao) {
    inicioPeriodo = new Date(demissao.getFullYear() - 1, admissao.getMonth(), admissao.getDate());
  }
  if (inicioPeriodo < admissao) inicioPeriodo = admissao;

  const diasNoPeriodo = Math.max(0, diferencaEmDias(inicioPeriodo, demissao));
  const mesesCompletos = Math.floor(diasNoPeriodo / 30);
  const fracao = diasNoPeriodo % 30;
  return Math.min(12, mesesCompletos + (fracao >= 15 ? 1 : 0));
};

const descreverTempoServico = (admissao: Date, demissao: Date) => {
  let anos = demissao.getFullYear() - admissao.getFullYear();
  let meses = demissao.getMonth() - admissao.getMonth();
  if (demissao.getDate() < admissao.getDate()) meses -= 1;
  if (meses < 0) {
    anos -= 1;
    meses += 12;
  }

  const partes = [];
  if (anos > 0) partes.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`);
  if (meses > 0) partes.push(`${meses} ${meses === 1 ? 'mês' : 'meses'}`);
  return partes.join(' e ') || 'menos de 1 mês';
};

const calcularAnosCompletos = (admissao: Date, demissao: Date) => {
  let anos = demissao.getFullYear() - admissao.getFullYear();
  const aniversarioNoAno = new Date(
    admissao.getFullYear() + anos,
    admissao.getMonth(),
    admissao.getDate(),
  );
  if (aniversarioNoAno > demissao) anos -= 1;
  return Math.max(0, anos);
};

const LinhaCalculo = ({
  titulo,
  descricao,
  valor,
  desconto = false,
}: {
  titulo: string;
  descricao: string;
  valor: number;
  desconto?: boolean;
}) => (
  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-border/50 py-2.5 last:border-b-0">
    <div className="min-w-0">
      <span className="block text-xs font-semibold text-foreground">{titulo}</span>
      <span className="mt-0.5 block text-[10px] leading-relaxed text-muted-foreground">{descricao}</span>
    </div>
    <strong className={`self-center whitespace-nowrap font-mono text-xs sm:text-sm ${desconto ? 'text-destructive' : 'text-foreground'}`}>
      {desconto ? '− ' : ''}{formatarMoeda(valor)}
    </strong>
  </div>
);

export const SimuladorRescisao = () => {
  const navigate = useNavigate();

  // DADOS DE ENTRADA DO FORMULÁRIO
  const [salarioBruto, setSalarioBruto] = useState('');
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [dataDemissao, setDataDemissao] = useState('');
  const [motivoRescisao, setMotivoRescisao] = useState<MotivoRescisao>('sem_justa_causa');
  const [avisoPrevio, setAvisoPrevio] = useState<TipoAvisoPrevio>('indenizado');
  const [possuiFeriasVencidas, setPossuiFeriasVencidas] = useState(false);
  const [saldoFgts, setSaldoFgts] = useState('');

  // RESULTADOS CALCULADOS
  const [resultado, setResultado] = useState<ResultadoRescisao | null>(null);

  const handleMotivoRescisao = (motivo: MotivoRescisao) => {
    setMotivoRescisao(motivo);
    if (motivo === 'pedido_demissao') setAvisoPrevio('trabalhado');
    else if (motivo === 'com_justa_causa') setAvisoPrevio('trabalhado');
    else setAvisoPrevio('indenizado');
    setResultado(null);
  };

  // CÁLCULO COMPLETO DA RESCISÃO
  const calcularRescisao = (e: React.FormEvent) => {
    e.preventDefault();

    const salario = parseMoeda(salarioBruto);
    const fgts = parseMoeda(saldoFgts);

    if (salario <= 0) {
      toast.error('Informe um valor de salário bruto válido.');
      return;
    }

    if (fgts < 0) {
      toast.error('O saldo do FGTS não pode ser negativo.');
      return;
    }

    if (!dataAdmissao || !dataDemissao) {
      toast.error('Informe as datas de admissão e demissão.');
      return;
    }

    const admissao = parseDataLocal(dataAdmissao);
    const demissao = parseDataLocal(dataDemissao);

    if (demissao < admissao) {
      toast.error('A data de demissão não pode ser anterior à data de admissão.');
      return;
    }

    // CÁLCULO DE TEMPO E DIAS
    const mesmoMesDaAdmissao = admissao.getFullYear() === demissao.getFullYear()
      && admissao.getMonth() === demissao.getMonth();
    const primeiroDiaTrabalhado = mesmoMesDaAdmissao ? admissao.getDate() : 1;
    const ultimoDiaDoMes = new Date(demissao.getFullYear(), demissao.getMonth() + 1, 0).getDate();
    const trabalhouMesCompleto = primeiroDiaTrabalhado === 1 && demissao.getDate() === ultimoDiaDoMes;
    const diasTrabalhadosMes = trabalhouMesCompleto
      ? 30
      : Math.min(30, demissao.getDate() - primeiroDiaTrabalhado + 1);
    const avosDecimoTerceiro = contarAvosDecimoTerceiro(admissao, demissao);
    const avosFerias = contarAvosFerias(admissao, demissao);

    // 1. SALDO DE SALÁRIO
    const valorSaldoSalario = (salario / 30) * diasTrabalhadosMes;

    // 2. AVISO PRÉVIO
    let valorAvisoPrevio = 0;
    const anosCompletos = calcularAnosCompletos(admissao, demissao);
    const diasAvisoProporcional = Math.min(90, 30 + (anosCompletos * 3));

    if (motivoRescisao === 'sem_justa_causa') {
      if (avisoPrevio === 'indenizado') {
        valorAvisoPrevio = (salario / 30) * diasAvisoProporcional;
      }
    } else if (motivoRescisao === 'acordo') {
      if (avisoPrevio === 'indenizado') {
        valorAvisoPrevio = ((salario / 30) * diasAvisoProporcional) / 2;
      }
    } else if (motivoRescisao === 'pedido_demissao' && avisoPrevio === 'nao_cumprido') {
      valorAvisoPrevio = -salario; // Desconto
    }

    // 3. 13º SALÁRIO PROPORCIONAL
    let valorDecimoTerceiro = 0;
    if (motivoRescisao !== 'com_justa_causa') {
      valorDecimoTerceiro = (salario / 12) * avosDecimoTerceiro;
    }

    // 4. FÉRIAS (PROPORCIONAIS + VENCIDAS + 1/3)
    let valorFeriasProporcionais = 0;
    let valorFeriasVencidas = 0;
    let valorTercoFeriasProporcionais = 0;
    let valorTercoFeriasVencidas = 0;

    if (motivoRescisao !== 'com_justa_causa') {
      valorFeriasProporcionais = (salario / 12) * avosFerias;
      valorTercoFeriasProporcionais = valorFeriasProporcionais / 3;
    }

    if (possuiFeriasVencidas) {
      valorFeriasVencidas = salario;
      valorTercoFeriasVencidas = valorFeriasVencidas / 3;
    }

    // 5. MULTA DO FGTS (40% OU 20% NO ACORDO)
    let valorMultaFgts = 0;
    if (motivoRescisao === 'sem_justa_causa') {
      valorMultaFgts = fgts * 0.40;
    } else if (motivoRescisao === 'acordo') {
      valorMultaFgts = fgts * 0.20;
    }

    // 6. ESTIMATIVA DE DESCONTOS (INSS PROGRESSIVO 2026)
    const descontoInssSaldo = calcularInss2026(valorSaldoSalario);
    const descontoInssDecimoTerceiro = calcularInss2026(valorDecimoTerceiro);
    const descontoAvisoPrevio = Math.abs(Math.min(0, valorAvisoPrevio));

    // TOTALIZADORES
    const proventos = valorSaldoSalario
      + Math.max(0, valorAvisoPrevio)
      + valorDecimoTerceiro
      + valorFeriasProporcionais
      + valorTercoFeriasProporcionais
      + valorFeriasVencidas
      + valorTercoFeriasVencidas;
    const descontos = descontoAvisoPrevio + descontoInssSaldo + descontoInssDecimoTerceiro;
    const valorLiquidoRescisao = Math.max(0, proventos - descontos);
    const totalComMultaFgts = valorLiquidoRescisao + valorMultaFgts;

    setResultado({
      diasTrabalhadosMes,
      diasAvisoProporcional,
      avosDecimoTerceiro,
      avosFerias,
      anosCompletos,
      tempoServicoTexto: descreverTempoServico(admissao, demissao),
      valorSaldoSalario,
      valorAvisoPrevio,
      valorDecimoTerceiro,
      valorFeriasProporcionais,
      valorTercoFeriasProporcionais,
      valorFeriasVencidas,
      valorTercoFeriasVencidas,
      saldoFgtsInformado: fgts,
      percentualMultaFgts: motivoRescisao === 'sem_justa_causa' ? 40 : motivoRescisao === 'acordo' ? 20 : 0,
      valorMultaFgts,
      descontoInssSaldo,
      descontoInssDecimoTerceiro,
      descontoAvisoPrevio,
      proventos,
      descontos,
      valorLiquidoRescisao,
      totalComMultaFgts,
    });

    toast.success('Simulação calculada com sucesso!');
  };

  const handleLimpar = () => {
    setSalarioBruto('');
    setDataAdmissao('');
    setDataDemissao('');
    setSaldoFgts('');
    setMotivoRescisao('sem_justa_causa');
    setAvisoPrevio('indenizado');
    setPossuiFeriasVencidas(false);
    setResultado(null);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* CABEÇALHO */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/ferramentas')} 
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para Ferramentas
          </Button>
          <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20 px-3 py-1 text-xs font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Direitos CLT
          </Badge>
        </div>

        {/* BANNER DINÂMICO LOCAL */}
        <ToolBanner secao="simulador_rescisao" />

        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight flex items-center justify-center gap-2">
            <FileSpreadsheet className="w-8 h-8 text-cyan-500" /> Simulador de Rescisão (CLT)
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Calcule uma estimativa completa dos seus direitos trabalhistas, aviso prévio, férias, 13º e multa do FGTS.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:items-start">

          {/* FORMULÁRIO DE ENTRADA */}
          <div className="space-y-4 lg:col-span-3">
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-cyan-500" /> Dados do Contrato de Trabalho
                </CardTitle>
                <CardDescription className="text-xs">
                  Preencha as informações do seu vínculo CLT para calcular o acerto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={calcularRescisao} className="space-y-4">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Último Salário Bruto (R$) *</Label>
                      <Input 
                        placeholder="Ex: 2500,00" 
                        inputMode="decimal"
                        value={salarioBruto} 
                        onChange={e => {
                          setSalarioBruto(e.target.value);
                          setResultado(null);
                        }}
                        required 
                        className="h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Saldo Atual do FGTS (R$)</Label>
                      <Input 
                        placeholder="Ex: 5000,00" 
                        inputMode="decimal"
                        value={saldoFgts} 
                        onChange={e => {
                          setSaldoFgts(e.target.value);
                          setResultado(null);
                        }}
                        className="h-10 text-sm"
                      />
                      <span className="block text-[10px] leading-relaxed text-muted-foreground">
                        Usado apenas para estimar a multa rescisória. Consulte o extrato no app FGTS.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Data de Admissão *</Label>
                      <Input 
                        type="date"
                        value={dataAdmissao} 
                        onChange={e => {
                          setDataAdmissao(e.target.value);
                          setResultado(null);
                        }}
                        required 
                        className="h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Data de Demissão / Desligamento *</Label>
                      <Input 
                        type="date"
                        value={dataDemissao} 
                        onChange={e => {
                          setDataDemissao(e.target.value);
                          setResultado(null);
                        }}
                        required 
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Motivo da Rescisão *</Label>
                      <Select value={motivoRescisao} onValueChange={(v) => handleMotivoRescisao(v as MotivoRescisao)}>
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sem_justa_causa">Demissão Sem Justa Causa (Pela Empresa)</SelectItem>
                          <SelectItem value="pedido_demissao">Pedido de Demissão (Pelo Funcionário)</SelectItem>
                          <SelectItem value="com_justa_causa">Demissão Com Justa Causa</SelectItem>
                          <SelectItem value="acordo">Acordo entre as Partes (Art. 484-A)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Aviso Prévio</Label>
                      {motivoRescisao === 'com_justa_causa' ? (
                        <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                          Não se aplica à justa causa
                        </div>
                      ) : (
                        <Select
                          value={avisoPrevio}
                          onValueChange={(v) => {
                            setAvisoPrevio(v as TipoAvisoPrevio);
                            setResultado(null);
                          }}
                        >
                          <SelectTrigger className="h-10 text-sm">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {motivoRescisao !== 'pedido_demissao' && (
                              <SelectItem value="indenizado">Indenizado (pago pela empresa)</SelectItem>
                            )}
                            <SelectItem value="trabalhado">Trabalhado</SelectItem>
                            {motivoRescisao === 'pedido_demissao' && (
                              <SelectItem value="nao_cumprido">Não cumprido (pode ser descontado)</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 border rounded-xl">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold block">Possui Férias Vencidas?</Label>
                      <span className="text-[11px] text-muted-foreground block">Marque se você acumulou mais de 12 meses sem tirar férias</span>
                    </div>
                    <Switch 
                      checked={possuiFeriasVencidas} 
                      onCheckedChange={(checked) => {
                        setPossuiFeriasVencidas(checked);
                        setResultado(null);
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button 
                      type="submit" 
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold h-11 rounded-xl gap-2 text-sm shadow-md"
                    >
                      <Calculator className="w-4 h-4" />
                      <span>Calcular Rescisão</span>
                    </Button>

                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleLimpar}
                      className="h-11 px-4 text-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Limpar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* PAINEL DE RESULTADOS DA RESCISÃO */}
          <div className="space-y-4 lg:col-span-2">
            <Card className="overflow-hidden border-border/60 bg-gradient-to-b from-card via-card to-cyan-500/5 shadow-md">
              <CardHeader className="border-b bg-muted/20 pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <DollarSign className="h-5 w-5 text-cyan-500" /> Demonstrativo da Rescisão
                </CardTitle>
                <CardDescription className="text-xs">
                  Confira cada verba e desconto antes do valor final estimado.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 p-4 sm:p-5">
                {resultado ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs">
                      <div>
                        <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">Tempo de serviço</span>
                        <strong className="mt-0.5 block text-foreground">{resultado.tempoServicoTexto}</strong>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">Aviso calculado</span>
                        <strong className="mt-0.5 block text-foreground">{resultado.diasAvisoProporcional} dias</strong>
                      </div>
                    </div>

                    {/* 1. VERBAS A RECEBER */}
                    <section aria-labelledby="titulo-proventos">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <PlusCircle className="h-4 w-4" />
                        </span>
                        <div>
                          <h2 id="titulo-proventos" className="text-sm font-extrabold text-foreground">1. Verbas a receber</h2>
                          <p className="text-[10px] text-muted-foreground">Valores brutos que compõem o acerto</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-background/50 px-3">
                        <LinhaCalculo
                          titulo={`Saldo de salário — ${resultado.diasTrabalhadosMes} dias`}
                          descricao="Último salário dividido por 30 e multiplicado pelos dias trabalhados no mês."
                          valor={resultado.valorSaldoSalario}
                        />
                        {resultado.valorAvisoPrevio > 0 && (
                          <LinhaCalculo
                            titulo={`Aviso prévio indenizado — ${resultado.diasAvisoProporcional} dias`}
                            descricao={motivoRescisao === 'acordo' ? 'No acordo, o aviso indenizado é pago pela metade.' : 'Proporcional ao tempo de serviço, limitado a 90 dias.'}
                            valor={resultado.valorAvisoPrevio}
                          />
                        )}
                        <LinhaCalculo
                          titulo={`13º salário proporcional — ${resultado.avosDecimoTerceiro}/12 avos`}
                          descricao="Cada mês com pelo menos 15 dias trabalhados conta como um avo."
                          valor={resultado.valorDecimoTerceiro}
                        />
                        <LinhaCalculo
                          titulo={`Férias proporcionais — ${resultado.avosFerias}/12 avos`}
                          descricao="Estimativa do período aquisitivo atual, sem incluir o adicional constitucional."
                          valor={resultado.valorFeriasProporcionais}
                        />
                        <LinhaCalculo
                          titulo="1/3 sobre férias proporcionais"
                          descricao="Adicional constitucional calculado separadamente para facilitar a conferência."
                          valor={resultado.valorTercoFeriasProporcionais}
                        />
                        {resultado.valorFeriasVencidas > 0 && (
                          <>
                            <LinhaCalculo
                              titulo="Férias vencidas"
                              descricao="Um período informado como adquirido e ainda não usufruído."
                              valor={resultado.valorFeriasVencidas}
                            />
                            <LinhaCalculo
                              titulo="1/3 sobre férias vencidas"
                              descricao="Adicional constitucional sobre o período vencido informado."
                              valor={resultado.valorTercoFeriasVencidas}
                            />
                          </>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                        <span className="font-bold">Subtotal de verbas</span>
                        <strong className="font-mono">{formatarMoeda(resultado.proventos)}</strong>
                      </div>
                    </section>

                    {/* 2. DESCONTOS */}
                    <section aria-labelledby="titulo-descontos">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-destructive">
                          <MinusCircle className="h-4 w-4" />
                        </span>
                        <div>
                          <h2 id="titulo-descontos" className="text-sm font-extrabold text-foreground">2. Descontos estimados</h2>
                          <p className="text-[10px] text-muted-foreground">Deduções consideradas nesta simulação</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-background/50 px-3">
                        <LinhaCalculo
                          titulo="INSS sobre saldo de salário"
                          descricao="Cálculo progressivo pelas faixas previdenciárias vigentes em 2026."
                          valor={resultado.descontoInssSaldo}
                          desconto
                        />
                        {resultado.descontoInssDecimoTerceiro > 0 && (
                          <LinhaCalculo
                            titulo="INSS sobre 13º proporcional"
                            descricao="O 13º possui apuração previdenciária separada do salário mensal."
                            valor={resultado.descontoInssDecimoTerceiro}
                            desconto
                          />
                        )}
                        {resultado.descontoAvisoPrevio > 0 && (
                          <LinhaCalculo
                            titulo="Aviso prévio não cumprido"
                            descricao="Estimativa de um salário descontado no pedido de demissão."
                            valor={resultado.descontoAvisoPrevio}
                            desconto
                          />
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between rounded-lg bg-red-500/10 px-3 py-2 text-sm text-destructive">
                        <span className="font-bold">Total de descontos</span>
                        <strong className="font-mono">− {formatarMoeda(resultado.descontos)}</strong>
                      </div>
                    </section>

                    {/* 3. FGTS */}
                    <section aria-labelledby="titulo-fgts">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <Landmark className="h-4 w-4" />
                        </span>
                        <div>
                          <h2 id="titulo-fgts" className="text-sm font-extrabold text-foreground">3. FGTS — separado do acerto</h2>
                          <p className="text-[10px] text-muted-foreground">O saldo da conta não é somado ao pagamento da empresa</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-background/50 px-3">
                        <LinhaCalculo
                          titulo="Saldo do FGTS informado"
                          descricao="Valor de referência digitado por você; confirme no extrato oficial."
                          valor={resultado.saldoFgtsInformado}
                        />
                        <LinhaCalculo
                          titulo={`Multa rescisória do FGTS — ${resultado.percentualMultaFgts}%`}
                          descricao={resultado.percentualMultaFgts > 0 ? 'Calculada sobre o saldo informado e exibida fora do líquido da rescisão.' : 'Não há multa estimada para o motivo de desligamento selecionado.'}
                          valor={resultado.valorMultaFgts}
                        />
                      </div>
                    </section>

                    {/* 4. TOTAL FINAL, APÓS O DETALHAMENTO */}
                    <section aria-labelledby="titulo-total" className="space-y-3 border-t border-border pt-5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                          <WalletCards className="h-4 w-4" />
                        </span>
                        <div>
                          <h2 id="titulo-total" className="text-sm font-extrabold text-foreground">4. Resultado final estimado</h2>
                          <p className="text-[10px] text-muted-foreground">Total exibido somente após toda a memória de cálculo</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-center">
                        <span className="block text-[10px] font-extrabold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                          Líquido estimado da rescisão
                        </span>
                        <strong className="mt-1 block text-3xl font-black text-cyan-700 dark:text-cyan-400">
                          {formatarMoeda(resultado.valorLiquidoRescisao)}
                        </strong>
                        <span className="mt-1 block text-[10px] text-muted-foreground">
                          Verbas de {formatarMoeda(resultado.proventos)} menos descontos de {formatarMoeda(resultado.descontos)}
                        </span>
                      </div>

                      {resultado.valorMultaFgts > 0 && (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                          <div className="flex items-center justify-between gap-3 text-sm text-emerald-700 dark:text-emerald-300">
                            <span className="font-semibold">Acerto líquido + multa do FGTS</span>
                            <strong className="whitespace-nowrap font-mono">{formatarMoeda(resultado.totalComMultaFgts)}</strong>
                          </div>
                          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                            Referência combinada. A multa e o saldo do FGTS seguem regras e canais de pagamento próprios.
                          </p>
                        </div>
                      )}
                    </section>
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                      <CalendarDays className="h-7 w-7" />
                    </div>
                    <h2 className="mt-4 text-sm font-bold text-foreground">Seu demonstrativo aparecerá aqui</h2>
                    <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                      Preencha os dados do contrato e calcule para conferir verbas, descontos, FGTS e total final em ordem.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="p-3 bg-muted/40 border border-border/60 rounded-xl text-[11px] text-muted-foreground space-y-1">
              <span className="font-bold text-foreground flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Nota Informativa
              </span>
              <p className="leading-relaxed">
                Estimativa informativa baseada nas regras gerais da CLT e nas faixas progressivas do INSS de 2026. Não inclui IRRF, médias de adicionais, faltas, adiantamentos, pensão, férias em dobro ou regras de convenção coletiva. Confirme o TRCT com o RH, sindicato ou profissional habilitado.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SimuladorRescisao;
