import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Calculator, Copy, Send, Sparkles, FileSpreadsheet, Check, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SimuladorRescisao = () => {
  const navigate = useNavigate();
  const [copiado, setCopiado] = useState(false);

  // FORMULÁRIO TOTALMENTE LIMPO (SEM VALORES AUTOCOMPLETADOS)
  const [salarioBruto, setSalarioBruto] = useState('');
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [dataDemissao, setDataDemissao] = useState('');
  const [motivo, setMotivo] = useState<string>('sem_justa_causa');
  const [avisoPrevio, setAvisoPrevio] = useState<string>('indenizado');
  const [feriasVencidas, setFeriasVencidas] = useState(false);
  const [saldoFgts, setSaldoFgts] = useState('');

  // CONVERSÃO DE VALORES
  const parseMoeda = (val: string) => parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
  const formatarMoeda = (num: number) => num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const salario = parseMoeda(salarioBruto);
  const fgtsAcumulado = parseMoeda(saldoFgts);

  // CÁLCULO DE DATAS E MESES TRABALHADOS
  let diasTrabalhadosMes = 0;
  let mesesAnosProporcional = 0;
  let anosCompletos = 0;

  if (dataAdmissao && dataDemissao) {
    const inicio = new Date(dataAdmissao);
    const fim = new Date(dataDemissao);

    if (fim >= inicio) {
      diasTrabalhadosMes = fim.getDate();

      const diffTime = Math.abs(fim.getTime() - inicio.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      anosCompletos = Math.floor(diffDays / 365);
      mesesAnosProporcional = Math.min(12, Math.ceil((diffDays % 365) / 30));
    }
  }

  // CÁLCULO DAS VERBAS RESCISÓRIAS
  const valorDiaSalario = salario > 0 ? salario / 30 : 0;
  
  // 1. Saldo de Salário
  const saldoSalarioVal = diasTrabalhadosMes * valorDiaSalario;

  // 2. Aviso Prévio (Lei 12.506/11 - 30 dias + 3 dias por ano completo)
  let diasAviso = 0;
  let avisoPrevioVal = 0;
  if (motivo === 'sem_justa_causa' && avisoPrevio === 'indenizado') {
    diasAviso = 30 + Math.min(60, anosCompletos * 3);
    avisoPrevioVal = diasAviso * valorDiaSalario;
  } else if (motivo === 'acordo' && avisoPrevio === 'indenizado') {
    diasAviso = (30 + Math.min(60, anosCompletos * 3)) / 2;
    avisoPrevioVal = diasAviso * valorDiaSalario;
  }

  // 3. 13º Salário Proporcional
  let decimoTerceiroVal = 0;
  if (motivo !== 'justa_causa') {
    const mesesDecimo = mesesAnosProporcional > 0 ? mesesAnosProporcional : 1;
    const fatorMotivo = motivo === 'acordo' ? 0.5 : 1;
    decimoTerceiroVal = (salario / 12) * mesesDecimo * fatorMotivo;
  }

  // 4. Férias Proporcionais + 1/3 Constitucional
  let feriasProporcionaisVal = 0;
  if (motivo !== 'justa_causa') {
    const mesesFerias = mesesAnosProporcional > 0 ? mesesAnosProporcional : 1;
    const baseFerias = (salario / 12) * mesesFerias;
    feriasProporcionaisVal = baseFerias + (baseFerias / 3);
  }

  // 5. Férias Vencidas + 1/3
  const feriasVencidasVal = feriasVencidas ? salario + (salario / 3) : 0;

  // 6. Multa FGTS (40% para sem justa causa, 20% para acordo)
  let multaFgtsVal = 0;
  if (motivo === 'sem_justa_causa') {
    multaFgtsVal = fgtsAcumulado * 0.40;
  } else if (motivo === 'acordo') {
    multaFgtsVal = fgtsAcumulado * 0.20;
  }

  // TOTAL BRUTO ESTIMADO
  const totalRescisaoEstimado = saldoSalarioVal + avisoPrevioVal + decimoTerceiroVal + feriasProporcionaisVal + feriasVencidasVal + multaFgtsVal;

  // RESUMO PARA WHATSAPP
  const gerarTextoResumo = () => {
    let msg = `📄 *ESTIMATIVA DE RESCISÃO TRABALHISTA (CLT)*\n\n`;
    msg += `💼 *Salário Base:* R$ ${formatarMoeda(salario)}\n`;
    msg += `📌 *Motivo:* ${
      motivo === 'sem_justa_causa' ? 'Demissão sem Justa Causa' :
      motivo === 'pedido' ? 'Pedido de Demissão' :
      motivo === 'justa_causa' ? 'Demissão com Justa Causa' : 'Acordo Mútuo'
    }\n\n`;
    msg += `💵 *Saldo de Salário (${diasTrabalhadosMes} dias):* R$ ${formatarMoeda(saldoSalarioVal)}\n`;
    if (avisoPrevioVal > 0) msg += `📢 *Aviso Prévio Indenizado:* R$ ${formatarMoeda(avisoPrevioVal)}\n`;
    if (decimoTerceiroVal > 0) msg += `🎄 *13º Proporcional:* R$ ${formatarMoeda(decimoTerceiroVal)}\n`;
    if (feriasProporcionaisVal > 0) msg += `🏖️ *Férias Prop. + 1/3:* R$ ${formatarMoeda(feriasProporcionaisVal)}\n`;
    if (feriasVencidasVal > 0) msg += `🗓️ *Férias Vencidas + 1/3:* R$ ${formatarMoeda(feriasVencidasVal)}\n`;
    if (multaFgtsVal > 0) msg += `🏦 *Multa do FGTS:* R$ ${formatarMoeda(multaFgtsVal)}\n`;
    msg += `\n💰 *TOTAL BRUTO ESTIMADO:* *R$ ${formatarMoeda(totalRescisaoEstimado)}*\n\n`;
    msg += `⚠️ *Nota:* Cálculo simulado para fins informativos. Descontos de INSS/IRRF podem ser aplicados na folha final.`;
    return msg;
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(gerarTextoResumo());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleEnviarWhatsApp = () => {
    const texto = encodeURIComponent(gerarTextoResumo());
    window.open(`https://wa.me/?text=${texto}`, '_blank');
  };

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
          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Direitos Trabalhistas
          </span>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Simulador de Rescisão Trabalhista
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Calcule uma estimativa dos seus direitos e verbas rescisórias de acordo com as regras da CLT.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* FORMULÁRIO DE DADOS */}
          <Card className="border-border/60 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" /> Informações do Contrato
              </CardTitle>
              <CardDescription className="text-xs">
                Preencha os dados de salário, datas e tipo de desligamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs font-semibold">Último Salário Bruto (R$) *</Label>
                <Input 
                  placeholder="Ex: 2500,00" 
                  value={salarioBruto} 
                  onChange={e => setSalarioBruto(e.target.value)} 
                  className="h-9 text-xs" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Data de Admissão</Label>
                  <Input 
                    type="date" 
                    value={dataAdmissao} 
                    onChange={e => setDataAdmissao(e.target.value)} 
                    className="h-9 text-xs" 
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Data de Demissão</Label>
                  <Input 
                    type="date" 
                    value={dataDemissao} 
                    onChange={e => setDataDemissao(e.target.value)} 
                    className="h-9 text-xs" 
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Motivo do Desligamento</Label>
                <Select value={motivo} onValueChange={setMotivo}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem_justa_causa">Demissão sem Justa Causa</SelectItem>
                    <SelectItem value="pedido">Pedido de Demissão</SelectItem>
                    <SelectItem value="acordo">Acordo Mútuo entre as Partes</SelectItem>
                    <SelectItem value="justa_causa">Demissão por Justa Causa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(motivo === 'sem_justa_causa' || motivo === 'acordo') && (
                <div>
                  <Label className="text-xs font-semibold">Aviso Prévio</Label>
                  <Select value={avisoPrevio} onValueChange={setAvisoPrevio}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indenizado">Indenizado pelo Empregador</SelectItem>
                      <SelectItem value="trabalhado">Trabalhado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="text-xs font-semibold">Saldo Atual no FGTS (R$ - Para cálculo de multa)</Label>
                <Input 
                  placeholder="Ex: 8000,00" 
                  value={saldoFgts} 
                  onChange={e => setSaldoFgts(e.target.value)} 
                  className="h-9 text-xs" 
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Possui Férias Vencidas?</Label>
                  <p className="text-[10px] text-muted-foreground">Marque se não tirou férias no último ano</p>
                </div>
                <Switch 
                  checked={feriasVencidas} 
                  onCheckedChange={setFeriasVencidas} 
                />
              </div>
            </CardContent>
          </Card>

          {/* RESULTADO E RESUMO */}
          <div className="space-y-4">
            
            <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-lg">
              <CardContent className="p-6 space-y-4 text-center">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Valor Total Bruto Estimado
                </span>
                <h2 className="text-4xl font-black text-foreground">
                  R$ {formatarMoeda(totalRescisaoEstimado)}
                </h2>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-left text-[11px]">
                  <div className="p-2 bg-background/60 rounded-lg border border-border/40">
                    <span className="text-muted-foreground block text-[10px]">Saldo de Salário:</span>
                    <strong className="text-foreground">R$ {formatarMoeda(saldoSalarioVal)}</strong>
                  </div>
                  <div className="p-2 bg-background/60 rounded-lg border border-border/40">
                    <span className="text-muted-foreground block text-[10px]">13º Proporcional:</span>
                    <strong className="text-foreground">R$ {formatarMoeda(decimoTerceiroVal)}</strong>
                  </div>
                  <div className="p-2 bg-background/60 rounded-lg border border-border/40">
                    <span className="text-muted-foreground block text-[10px]">Férias + 1/3:</span>
                    <strong className="text-foreground">R$ {formatarMoeda(feriasProporcionaisVal + feriasVencidasVal)}</strong>
                  </div>
                  <div className="p-2 bg-background/60 rounded-lg border border-border/40">
                    <span className="text-muted-foreground block text-[10px]">Multa do FGTS:</span>
                    <strong className="text-emerald-600 font-bold">R$ {formatarMoeda(multaFgtsVal)}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PRE-VISUALIZAÇÃO DE RESUMO */}
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Resumo do Cálculo para Copiar ou Enviar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed bg-background p-3 rounded-lg border border-border/40 max-h-48 overflow-y-auto">
                  {gerarTextoResumo()}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline"
                    onClick={handleCopiar}
                    className="w-full border-primary text-primary hover:bg-primary/10 font-bold h-11 rounded-xl text-xs gap-2"
                  >
                    {copiado ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copiado ? 'Copiado!' : 'Copiar Resumo'}
                  </Button>

                  <Button 
                    onClick={handleEnviarWhatsApp}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl text-xs gap-2 shadow-lg"
                  >
                    <Send className="w-4 h-4" /> Enviar WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>
      </div>
    </div>
  );
};

export default SimuladorRescisao;
