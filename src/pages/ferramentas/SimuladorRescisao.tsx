import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/raw-switch';
import { ArrowLeft, FileSpreadsheet, Calculator, Sparkles, AlertCircle, Info, DollarSign, HelpCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// COMPONENTE DE BANNER LOCAL
const ToolBanner = ({ secao }: { secao: string }) => {
  const [banners, setBanners] = useState<any[]>([]);

  useEffect(() => {
    const buscarBanners = async () => {
      try {
        const { data } = await supabase
          .from('banners' as any)
          .select('*')
          .eq('ativo', true)
          .in('secao', [secao, 'ferramentas'])
          .order('ordem', { ascending: true });

        if (data && data.length > 0) {
          setBanners(data);
        }
      } catch (err) {
        console.error(`Erro ao carregar banners para ${secao}:`, err);
      }
    };

    buscarBanners();
  }, [secao]);

  if (banners.length === 0) return null;

  return (
    <div className="w-full space-y-3 my-4">
      {banners.map((b) => {
        if (b.tipo_midia === 'codigo' && b.codigo_html) {
          return (
            <div 
              key={b.id} 
              className="w-full rounded-2xl overflow-hidden shadow-sm border border-border/60 bg-card p-2 text-center"
              dangerouslySetInnerHTML={{ __html: b.codigo_html }}
            />
          );
        }

        return (
          <a
            key={b.id}
            href={b.link_url || b.link_destino || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-2xl overflow-hidden shadow-sm border border-border/60 hover:opacity-95 transition-opacity"
          >
            <img
              src={b.imagem_url || b.imagem}
              alt={b.titulo || 'Banner de Anúncio'}
              className="w-full h-auto max-h-[160px] sm:max-h-[220px] object-cover"
            />
          </a>
        );
      })}
    </div>
  );
};

export const SimuladorRescisao = () => {
  const navigate = useNavigate();

  // DADOS DE ENTRADA DO FORMULÁRIO
  const [salarioBruto, setSalarioBruto] = useState('');
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [dataDemissao, setDataDemissao] = useState('');
  const [motivoRescisao, setMotivoRescisao] = useState<'sem_justa_causa' | 'com_justa_causa' | 'pedido_demissao' | 'acordo'>('sem_justa_causa');
  const [avisoPrevio, setAvisoPrevio] = useState<'indenizado' | 'trabalhado' | 'nao_cumprido'>('indenizado');
  const [possuiFeriasVencidas, setPossuiFeriasVencidas] = useState(false);
  const [saldoFgts, setSaldoFgts] = useState('');
  const [dependentes, setDependentes] = useState('0');

  // RESULTADOS CALCULADOS
  const [resultado, setResultado] = useState<any | null>(null);

  // CÁLCULO COMPLETO DA RESCISÃO
  const calcularRescisao = (e: React.FormEvent) => {
    e.preventDefault();

    const salario = parseFloat(salarioBruto.replace(',', '.')) || 0;
    const fgts = parseFloat(saldoFgts.replace(',', '.')) || 0;
    const numDependentes = parseInt(dependentes) || 0;

    if (salario <= 0) {
      toast.error('Informe um valor de salário bruto válido.');
      return;
    }

    if (!dataAdmissao || !dataDemissao) {
      toast.error('Informe as datas de admissão e demissão.');
      return;
    }

    const admissao = new Date(dataAdmissao);
    const demissao = new Date(dataDemissao);

    if (demissao < admissao) {
      toast.error('A data de demissão não pode ser anterior à data de admissão.');
      return;
    }

    // CÁLCULO DE TEMPO E DIAS
    const diasTrabalhadosMes = demissao.getDate();
    const mesesTrabalhadosAno = demissao.getMonth() + (diasTrabalhadosMes >= 15 ? 1 : 0);

    // 1. SALDO DE SALÁRIO
    const valorSaldoSalario = (salario / 30) * diasTrabalhadosMes;

    // 2. AVISO PRÉVIO
    let valorAvisoPrevio = 0;
    const anosCompletos = Math.floor((demissao.getTime() - admissao.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
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
      const fracao13 = (motivoRescisao === 'acordo') ? mesesTrabalhadosAno : mesesTrabalhadosAno;
      valorDecimoTerceiro = (salario / 12) * fracao13;
    }

    // 4. FÉRIAS (PROPORCIONAIS + VENCIDAS + 1/3)
    let valorFeriasProporcionais = 0;
    let valorFeriasVencidas = 0;
    let valorUmTercasFerias = 0;

    if (motivoRescisao !== 'com_justa_causa') {
      valorFeriasProporcionais = (salario / 12) * mesesTrabalhadosAno;
    }

    if (possuiFeriasVencidas) {
      valorFeriasVencidas = salario;
    }

    valorUmTercasFerias = (valorFeriasProporcionais + valorFeriasVencidas) / 3;

    // 5. MULTA DO FGTS (40% OU 20% NO ACORDO)
    let valorMultaFgts = 0;
    if (motivoRescisao === 'sem_justa_causa') {
      valorMultaFgts = fgts * 0.40;
    } else if (motivoRescisao === 'acordo') {
      valorMultaFgts = fgts * 0.20;
    }

    // 6. ESTIMATIVA DE DESCONTOS (INSS)
    let descontoInss = 0;
    const baseInss = valorSaldoSalario;
    if (baseInss <= 1412) descontoInss = baseInss * 0.075;
    else if (baseInss <= 2666.68) descontoInss = baseInss * 0.09 - 21.18;
    else if (baseInss <= 4000.03) descontoInss = baseInss * 0.12 - 101.18;
    else descontoInss = Math.min(908.85, baseInss * 0.14 - 181.18);

    descontoInss = Math.max(0, descontoInss);

    // TOTALIZADORES
    const proventos = valorSaldoSalario + Math.max(0, valorAvisoPrevio) + valorDecimoTerceiro + valorFeriasProporcionais + valorFeriasVencidas + valorUmTercasFerias;
    const descontos = Math.abs(Math.min(0, valorAvisoPrevio)) + descontoInss;
    const valorLiquidoRescisao = Math.max(0, proventos - descontos);
    const totalComMultaFgts = valorLiquidoRescisao + valorMultaFgts;

    setResultado({
      diasTrabalhadosMes,
      diasAvisoProporcional,
      valorSaldoSalario,
      valorAvisoPrevio,
      valorDecimoTerceiro,
      valorFeriasProporcionais,
      valorFeriasVencidas,
      valorUmTercasFerias,
      valorMultaFgts,
      descontoInss,
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
    setPossuiFeriasVencidas(false);
    setResultado(null);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* FORMULÁRIO DE ENTRADA */}
          <div className="lg:col-span-2 space-y-4">
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
                        value={salarioBruto} 
                        onChange={e => setSalarioBruto(e.target.value)} 
                        required 
                        className="h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Saldo Atual do FGTS (R$)</Label>
                      <Input 
                        placeholder="Ex: 5000,00" 
                        value={saldoFgts} 
                        onChange={e => setSaldoFgts(e.target.value)} 
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Data de Admissão *</Label>
                      <Input 
                        type="date"
                        value={dataAdmissao} 
                        onChange={e => setDataAdmissao(e.target.value)} 
                        required 
                        className="h-10 text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Data de Demissão / Desligamento *</Label>
                      <Input 
                        type="date"
                        value={dataDemissao} 
                        onChange={e => setDataDemissao(e.target.value)} 
                        required 
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Motivo da Rescisão *</Label>
                      <Select value={motivoRescisao} onValueChange={(v: any) => setMotivoRescisao(v)}>
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
                      <Select value={avisoPrevio} onValueChange={(v: any) => setAvisoPrevio(v)}>
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="indenizado">Indenizado (Pago pela Empresa)</SelectItem>
                          <SelectItem value="trabalhado">Trabalhado</SelectItem>
                          <SelectItem value="nao_cumprido">Não Cumprido (Descontado do Funcionário)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 border rounded-xl">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold block">Possui Férias Vencidas?</Label>
                      <span className="text-[11px] text-muted-foreground block">Marque se você acumulou mais de 12 meses sem tirar férias</span>
                    </div>
                    <Switch 
                      checked={possuiFeriasVencidas} 
                      onChange={setPossuiFeriasVencidas} 
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
          <div className="space-y-4">
            <Card className="border-border/60 shadow-md bg-gradient-to-b from-card via-card to-cyan-500/5">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-cyan-500" /> Resumo do Acerto Estimado
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {resultado ? (
                  <div className="space-y-4">
                    
                    {/* DESTAQUE DO VALOR LÍQUIDO */}
                    <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-center space-y-1">
                      <span className="text-[11px] text-cyan-700 dark:text-cyan-300 font-extrabold uppercase tracking-wider block">
                        Valor Líquido da Rescisão
                      </span>
                      <strong className="text-3xl font-black text-cyan-700 dark:text-cyan-400 block">
                        R$ {resultado.valorLiquidoRescisao.toFixed(2)}
                      </strong>
                      <span className="text-[10px] text-muted-foreground block">
                        (Sem considerar saques do FGTS)
                      </span>
                    </div>

                    {resultado.valorMultaFgts > 0 && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase block">
                          + Multa Rescisória do FGTS
                        </span>
                        <strong className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 block">
                          R$ {resultado.valorMultaFgts.toFixed(2)}
                        </strong>
                      </div>
                    )}

                    {/* DETALHAMENTO DOS PROVENTOS */}
                    <div className="space-y-2 text-xs border-t pt-3">
                      <span className="font-extrabold uppercase text-[10px] text-muted-foreground block">
                        Detalhamento de Proventos (Receber)
                      </span>

                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Saldo de Salário ({resultado.diasTrabalhadosMes} dias):</span>
                        <strong className="font-mono text-foreground">R$ {resultado.valorSaldoSalario.toFixed(2)}</strong>
                      </div>

                      {resultado.valorAvisoPrevio > 0 && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Aviso Prévio Indenizado ({resultado.diasAvisoProporcional} dias):</span>
                          <strong className="font-mono text-foreground">R$ {resultado.valorAvisoPrevio.toFixed(2)}</strong>
                        </div>
                      )}

                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span className="text-muted-foreground">13º Salário Proporcional:</span>
                        <strong className="font-mono text-foreground">R$ {resultado.valorDecimoTerceiro.toFixed(2)}</strong>
                      </div>

                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Férias Proporcionais + 1/3:</span>
                        <strong className="font-mono text-foreground">R$ {(resultado.valorFeriasProporcionais + (resultado.valorFeriasProporcionais / 3)).toFixed(2)}</strong>
                      </div>

                      {resultado.valorFeriasVencidas > 0 && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Férias Vencidas + 1/3:</span>
                          <strong className="font-mono text-foreground">R$ {(resultado.valorFeriasVencidas + (resultado.valorFeriasVencidas / 3)).toFixed(2)}</strong>
                        </div>
                      )}
                    </div>

                    {/* DETALHAMENTO DOS DESCONTOS */}
                    <div className="space-y-2 text-xs border-t pt-2">
                      <span className="font-extrabold uppercase text-[10px] text-muted-foreground block">
                        Descontos Estimados
                      </span>

                      <div className="flex justify-between py-1 border-b border-border/40 text-destructive">
                        <span>Desconto INSS (Saldo Salário):</span>
                        <strong className="font-mono">- R$ {resultado.descontoInss.toFixed(2)}</strong>
                      </div>

                      {resultado.valorAvisoPrevio < 0 && (
                        <div className="flex justify-between py-1 border-b border-border/40 text-destructive">
                          <span>Desconto Aviso Prévio Não Cumprido:</span>
                          <strong className="font-mono">- R$ {Math.abs(resultado.valorAvisoPrevio).toFixed(2)}</strong>
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="py-8 text-center space-y-2">
                    <Info className="w-8 h-8 text-muted-foreground/50 mx-auto" />
                    <p className="text-xs text-muted-foreground">
                      Preencha o formulário e clique em <strong>Calcular Rescisão</strong> para ver o resultado detalhado.
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
                Este cálculo é uma simulação demonstrativa baseada na CLT. Valores exatos podem variar conforme convenções coletivas de cada categoria.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SimuladorRescisao;
