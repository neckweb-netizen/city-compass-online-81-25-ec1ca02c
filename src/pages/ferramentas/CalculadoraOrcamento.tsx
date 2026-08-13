import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calculator, Sparkles, Clock, DollarSign, RefreshCw, FileText, Info, Percent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ToolBanner } from '@/components/ferramentas/ToolBanner';

export const CalculadoraOrcamento = () => {
  const navigate = useNavigate();

  // DADOS DE ENTRADA: VALOR HORA BASE
  const [pretensaoMensal, setPretensaoMensal] = useState('3000');
  const [horasDia, setHorasDia] = useState('8');
  const [diasMes, setDiasMes] = useState('20');
  const [custosFixos, setCustosFixos] = useState('500');
  const [impostosPorcentagem, setImpostosPorcentagem] = useState('6'); // Ex: MEI ou Simples

  // DADOS DE ENTRADA: PROJETO ESPECÍFICO
  const [horasProjeto, setHorasProjeto] = useState('10');
  const [custosExtrasProjeto, setCustosExtrasProjeto] = useState('0');
  const [margemLucroProjeto, setMargemLucroProjeto] = useState('20');

  // CÁLCULOS DO VALOR/HORA
  const pretensao = parseFloat(pretensaoMensal.replace(',', '.')) || 0;
  const horasPorDia = parseFloat(horasDia.replace(',', '.')) || 0;
  const diasPorMes = parseFloat(diasMes.replace(',', '.')) || 0;
  const custos = parseFloat(custosFixos.replace(',', '.')) || 0;
  const impostos = parseFloat(impostosPorcentagem.replace(',', '.')) || 0;

  const totalHorasMes = horasPorDia * diasPorMes;
  const custoTotalMensal = pretensao + custos;
  
  // VALOR DA HORA LÍQUIDO E BRUTO (COM IMPOSTOS)
  const valorHoraBase = totalHorasMes > 0 ? custoTotalMensal / totalHorasMes : 0;
  const fatorImposto = impostos < 100 ? 1 - (impostos / 100) : 1;
  const valorHoraRecomendado = fatorImposto > 0 ? valorHoraBase / fatorImposto : valorHoraBase;

  // CÁLCULOS DO PROJETO
  const hrsProjeto = parseFloat(horasProjeto.replace(',', '.')) || 0;
  const extrasProjeto = parseFloat(custosExtrasProjeto.replace(',', '.')) || 0;
  const margemProjeto = parseFloat(margemLucroProjeto.replace(',', '.')) || 0;

  const subtotalMaoDeObra = hrsProjeto * valorHoraRecomendado;
  const subtotalComExtras = subtotalMaoDeObra + extrasProjeto;
  const valorMargemLucro = subtotalComExtras * (margemProjeto / 100);
  const precoTotalProjeto = subtotalComExtras + valorMargemLucro;

  const handleLimpar = () => {
    setPretensaoMensal('3000');
    setHorasDia('8');
    setDiasMes('20');
    setCustosFixos('500');
    setImpostosPorcentagem('6');
    setHorasProjeto('10');
    setCustosExtrasProjeto('0');
    setMargemLucroProjeto('20');
    toast.info('Valores redefinidos para os padrões.');
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
          <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 px-3 py-1 text-xs font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Precificação Freelance
          </Badge>
        </div>

        {/* BANNER DINÂMICO LOCAL */}
        <ToolBanner secao="calculadora_orcamento" />

        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight flex items-center justify-center gap-2">
            <Calculator className="w-8 h-8 text-purple-500" /> Calculadora de Hora & Orçamentos
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Descubra quanto cobrar por hora de trabalho e crie orçamentos lucrativos para seus serviços.
          </p>
        </div>

        {/* ETAPA 1: DEFINIR SEU VALOR HORA */}
        <Card className="border-border/60 shadow-md">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" /> Passo 1: Descubra o Valor da Sua Hora
                </CardTitle>
                <CardDescription className="text-xs">
                  Informe seus objetivos financeiros e rotina de trabalho
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLimpar} className="h-8 text-xs gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Resetar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Pretensão Salarial Mensal (R$)</Label>
                <Input 
                  placeholder="Ex: 3000,00" 
                  value={pretensaoMensal} 
                  onChange={e => setPretensaoMensal(e.target.value)} 
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Custos Fixos Mensais (Luz, Net, MEI)</Label>
                <Input 
                  placeholder="Ex: 500,00" 
                  value={custosFixos} 
                  onChange={e => setCustosFixos(e.target.value)} 
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Impostos / Taxas (%)</Label>
                <Input 
                  placeholder="Ex: 6" 
                  value={impostosPorcentagem} 
                  onChange={e => setImpostosPorcentagem(e.target.value)} 
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Horas Trabalhadas por Dia</Label>
                <Input 
                  placeholder="Ex: 8" 
                  value={horasDia} 
                  onChange={e => setHorasDia(e.target.value)} 
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Dias Trabalhados por Mês</Label>
                <Input 
                  placeholder="Ex: 20" 
                  value={diasMes} 
                  onChange={e => setDiasMes(e.target.value)} 
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <Label className="text-xs font-semibold text-muted-foreground block">Total Horas/Mês</Label>
                <div className="h-10 px-3 bg-muted/40 border rounded-md flex items-center font-bold text-sm text-foreground">
                  {totalHorasMes} horas
                </div>
              </div>
            </div>

            {/* RESUMO VALOR HORA */}
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-center sm:text-left">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 block">
                  Sua Hora Recomendada (com impostos)
                </span>
                <p className="text-xs text-muted-foreground">
                  Considerando R$ {custoTotalMensal.toFixed(2)} de custos totais/mês
                </p>
              </div>

              <div className="text-center sm:text-right">
                <strong className="text-3xl font-black text-purple-700 dark:text-purple-400 block">
                  R$ {valorHoraRecomendado.toFixed(2)} /h
                </strong>
                <span className="text-[10px] text-muted-foreground block">
                  (Mínimo absoluto: R$ {valorHoraBase.toFixed(2)}/h)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ETAPA 2: ORÇAR UM PROJETO ESPECÍFICO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 space-y-4">
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-500" /> Passo 2: Monte o Orçamento do Projeto
                </CardTitle>
                <CardDescription className="text-xs">
                  Calcule o preço final ajustando horas estimadas e margem de lucro
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Horas Estimadas no Projeto</Label>
                    <Input 
                      placeholder="Ex: 10" 
                      value={horasProjeto} 
                      onChange={e => setHorasProjeto(e.target.value)} 
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Custos Extras/Insumos (R$)</Label>
                    <Input 
                      placeholder="Ex: 50,00" 
                      value={custosExtrasProjeto} 
                      onChange={e => setCustosExtrasProjeto(e.target.value)} 
                      className="h-10 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Margem de Lucro Adicional (%)</Label>
                    <Input 
                      placeholder="Ex: 20" 
                      value={margemLucroProjeto} 
                      onChange={e => setMargemLucroProjeto(e.target.value)} 
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="p-3 bg-muted/30 border rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Mão de Obra ({hrsProjeto}h × R$ {valorHoraRecomendado.toFixed(2)}):</span>
                    <strong className="text-foreground">R$ {subtotalMaoDeObra.toFixed(2)}</strong>
                  </div>
                  {extrasProjeto > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Custos Extras / Insumos:</span>
                      <strong className="text-foreground">R$ {extrasProjeto.toFixed(2)}</strong>
                    </div>
                  )}
                  {margemProjeto > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Margem de Lucro (+{margemProjeto}%):</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">R$ {valorMargemLucro.toFixed(2)}</strong>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CARD DE RESULTADO DO PROJETO */}
          <div>
            <Card className="border-border/60 shadow-md bg-gradient-to-b from-card via-card to-purple-500/5 h-full flex flex-col justify-between">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-500" /> Preço Sugerido do Serviço
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6 space-y-4 text-center my-auto">
                <span className="text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-300 block">
                  Valor Total a Cobrar do Cliente
                </span>

                <strong className="text-4xl font-black text-purple-700 dark:text-purple-400 block">
                  R$ {precoTotalProjeto.toFixed(2)}
                </strong>

                <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t">
                  Este valor cobre suas despesas, impostos, suas {hrsProjeto} horas trabalhadas e garante R$ {valorMargemLucro.toFixed(2)} de lucro adicional.
                </p>
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CalculadoraOrcamento;
