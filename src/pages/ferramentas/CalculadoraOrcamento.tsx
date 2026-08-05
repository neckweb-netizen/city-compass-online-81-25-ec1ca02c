import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Calculator, Copy, Send, Sparkles, DollarSign, Clock, FileText, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CalculadoraOrcamento = () => {
  const navigate = useNavigate();
  const [copiado, setCopiado] = useState(false);

  // DADOS DA CALCULADORA DA HORA
  const [metaSalarial, setMetaSalarial] = useState('3000,00');
  const [custosFixos, setCustosFixos] = useState('500,00');
  const [diasTrabalhados, setDiasTrabalhados] = useState('22');
  const [horasPorDia, setHorasPorDia] = useState('8');

  // DADOS DO ORÇAMENTO
  const [nomeCliente, setNomeCliente] = useState('');
  const [descricaoServico, setDescricaoServico] = useState('');
  const [horasEstimadas, setHorasEstimadas] = useState('5');
  const [custoMateriais, setCustoMateriais] = useState('0,00');
  const [margemLucro, setMargemLucro] = useState('20');

  // FUNÇÕES AUXILIARES DE CONVERSÃO
  const parseMoeda = (val: string) => parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
  const formatarMoeda = (num: number) => num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // CÁLCULOS DA HORA DE TRABALHO
  const salarioNum = parseMoeda(metaSalarial);
  const custosNum = parseMoeda(custosFixos);
  const diasNum = parseFloat(diasTrabalhados) || 1;
  const horasNum = parseFloat(horasPorDia) || 1;

  const totalHorasMes = diasNum * horasNum;
  const custoTotalMensal = salarioNum + custosNum;
  const valorHoraCalculado = totalHorasMes > 0 ? custoTotalMensal / totalHorasMes : 0;

  // CÁLCULOS DO ORÇAMENTO
  const horasServico = parseFloat(horasEstimadas) || 0;
  const materiaisNum = parseMoeda(custoMateriais);
  const lucroPorcentagem = parseFloat(margemLucro) || 0;

  const subtotalMaoDeObra = horasServico * valorHoraCalculado;
  const subtotalBase = subtotalMaoDeObra + materiaisNum;
  const valorTotalOrcamento = subtotalBase + (subtotalBase * (lucroPorcentagem / 100));

  // GERAR TEXTO PARA O WHATSAPP
  const gerarTextoOrcamento = () => {
    let msg = `📄 *ORÇAMENTO DE SERVIÇO*\n`;
    if (nomeCliente.trim()) msg += `👤 *Cliente:* ${nomeCliente}\n`;
    msg += `🔧 *Serviço:* ${descricaoServico.trim() || 'Prestação de Serviço'}\n\n`;
    msg += `⏱️ *Tempo Estimado:* ${horasServico} hora(s)\n`;
    if (materiaisNum > 0) msg += `📦 *Materiais/Outros:* R$ ${custoMateriais}\n`;
    msg += `💰 *Valor Total:* *R$ ${formatarMoeda(valorTotalOrcamento)}*\n\n`;
    msg += `💬 Orcamento válido por 15 dias. Ficou alguma dúvida?`;
    return msg;
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(gerarTextoOrcamento());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleEnviarWhatsApp = () => {
    const texto = encodeURIComponent(gerarTextoOrcamento());
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
            <Sparkles className="w-3.5 h-3.5" /> Utilitário de Precificação
          </span>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Calculadora de Valor/Hora & Orçamentos
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Descubra quanto cobrar por hora de trabalho e crie orçamentos profissionais para enviar aos seus clientes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* PAINEL 1: CALCULAR O VALOR DA SUA HORA */}
          <div className="space-y-6">
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" /> 1. Quanto Vale Sua Hora?
                </CardTitle>
                <CardDescription className="text-xs">
                  Informe seus custos e pretensão salarial mensal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Salário Desejado (R$)</Label>
                    <Input 
                      value={metaSalarial} 
                      onChange={e => setMetaSalarial(e.target.value)} 
                      className="h-9 text-xs" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Custos Fixos Mensais (R$)</Label>
                    <Input 
                      value={custosFixos} 
                      onChange={e => setCustosFixos(e.target.value)} 
                      className="h-9 text-xs" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Dias Trabalhados / Mês</Label>
                    <Input 
                      type="number" 
                      value={diasTrabalhados} 
                      onChange={e => setDiasTrabalhados(e.target.value)} 
                      className="h-9 text-xs" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Horas / Dia</Label>
                    <Input 
                      type="number" 
                      value={horasPorDia} 
                      onChange={e => setHorasPorDia(e.target.value)} 
                      className="h-9 text-xs" 
                    />
                  </div>
                </div>

                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-center mt-4">
                  <p className="text-xs font-bold text-primary uppercase">Valor Recomendado da Sua Hora</p>
                  <h3 className="text-3xl font-black text-foreground mt-1">
                    R$ {formatarMoeda(valorHoraCalculado)}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Total de {totalHorasMes}h trabalhadas/mês | Custo mensal: R$ {formatarMoeda(custoTotalMensal)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PAINEL 2: GERAR ORÇAMENTO DO SERVIÇO */}
          <div className="space-y-6">
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" /> 2. Gerar Orçamento do Serviço
                </CardTitle>
                <CardDescription className="text-xs">
                  Preencha os detalhes do serviço prestado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold">Nome do Cliente (Opcional)</Label>
                  <Input 
                    placeholder="Ex: Carlos Andrade" 
                    value={nomeCliente} 
                    onChange={e => setNomeCliente(e.target.value)} 
                    className="h-9 text-xs" 
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Descrição do Serviço</Label>
                  <Input 
                    placeholder="Ex: Instalação Elétrica / Limpeza de Ar Condicionado" 
                    value={descricaoServico} 
                    onChange={e => setDescricaoServico(e.target.value)} 
                    className="h-9 text-xs" 
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs font-semibold">Horas Gastas</Label>
                    <Input 
                      type="number" 
                      value={horasEstimadas} 
                      onChange={e => setHorasEstimadas(e.target.value)} 
                      className="h-9 text-xs" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Materiais (R$)</Label>
                    <Input 
                      value={custoMateriais} 
                      onChange={e => setCustoMateriais(e.target.value)} 
                      className="h-9 text-xs" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Lucro (%)</Label>
                    <Input 
                      type="number" 
                      value={margemLucro} 
                      onChange={e => setMargemLucro(e.target.value)} 
                      className="h-9 text-xs" 
                    />
                  </div>
                </div>

                {/* PRÉ-VISUALIZAÇÃO DA MENSAGEM */}
                <div className="p-4 bg-muted/40 border border-border/60 rounded-xl space-y-2 mt-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Pré-visualização do Envio
                  </span>
                  <p className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed bg-background p-3 rounded-lg border border-border/40">
                    {gerarTextoOrcamento()}
                  </p>
                </div>

                {/* BOTÕES DE AÇÃO LADO A LADO */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button 
                    variant="outline"
                    onClick={handleCopiar}
                    className="w-full border-primary text-primary hover:bg-primary/10 font-bold h-11 rounded-xl text-xs gap-2"
                  >
                    {copiado ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copiado ? 'Copiado!' : 'Copiar Texto'}
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

export default CalculadoraOrcamento;

