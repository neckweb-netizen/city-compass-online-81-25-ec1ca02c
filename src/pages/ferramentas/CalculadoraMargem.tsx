import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calculator, Copy, Send, Sparkles, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// COMPONENTE DE BANNER EMBUTIDO LOCALMENTE (PREVINE ERRO DE IMPORTAÇÃO NO VERCEL)
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

// BANCO DE DADOS DE TAXAS MÉDIAS ATUAIS DAS TOP 6 OPERADORAS
const OPERADORAS = {
  ton: { nome: 'Ton (Plano Promocional/Max)', pix: 0.99, debito: 1.45, cred1x: 3.51, cred6x: 11.50, cred12x: 14.79 },
  mercado_pago: { nome: 'Mercado Pago', pix: 0.00, debito: 1.67, cred1x: 3.57, cred6x: 11.00, cred12x: 13.99 },
  infinitepay: { nome: 'InfinitePay', pix: 0.00, debito: 1.37, cred1x: 3.15, cred6x: 8.28, cred12x: 12.40 },
  sumup: { nome: 'SumUp', pix: 0.00, debito: 1.29, cred1x: 3.99, cred6x: 11.50, cred12x: 12.65 },
  pagbank: { nome: 'PagBank / PagSeguro', pix: 0.00, debito: 1.99, cred1x: 4.99, cred6x: 10.50, cred12x: 16.20 },
  stone: { nome: 'Stone', pix: 0.75, debito: 1.25, cred1x: 3.11, cred6x: 10.00, cred12x: 12.00 },
  custom: { nome: '✏️ Digitar Taxa Manualmente', pix: 0, debito: 0, cred1x: 0, cred6x: 0, cred12x: 0 },
};

export const CalculadoraMargem = () => {
  const navigate = useNavigate();
  const [copiado, setCopiado] = useState(false);

  // FORMULÁRIO LIMPO (APENAS PLACEHOLDERS)
  const [nomeProduto, setNomeProduto] = useState('');
  const [custoProduto, setCustoProduto] = useState('');
  const [margemLucroDesejada, setMargemLucroDesejada] = useState('');
  const [operadoraSelecionada, setOperadoraSelecionada] = useState<string>('mercado_pago');
  const [modalidadePagamento, setModalidadePagamento] = useState<string>('debito');
  const [taxaManual, setTaxaManual] = useState('');
  const [descontoPixPercentual, setDescontoPixPercentual] = useState('');

  // PARSER DE MOEDA E VALORES
  const parseMoeda = (val: string) => parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0;
  const formatarMoeda = (num: number) => num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const custo = parseMoeda(custoProduto);
  const margemDesejada = parseFloat(margemLucroDesejada) || 0;
  const descPix = parseFloat(descontoPixPercentual) || 0;

  // DETERMINAR A TAXA DA MAQUININHA APLICADA
  let taxaMaquininha = 0;
  if (operadoraSelecionada === 'custom') {
    taxaMaquininha = parseFloat(taxaManual.replace(',', '.')) || 0;
  } else {
    const op = OPERADORAS[operadoraSelecionada as keyof typeof OPERADORAS];
    if (op) {
      taxaMaquininha = op[modalidadePagamento as keyof typeof op] as number || 0;
    }
  }

  // CÁLCULO DE MARKUP REAL PARA GARANTIR A MARGEM LÍQUIDA DESEJADA
  // Fórmula de Preço de Venda = Custo / (1 - (Margem% + Taxa%) / 100)
  const somaPorcentagens = (margemDesejada + taxaMaquininha) / 100;
  let precoVendaIdeal = 0;
  if (somaPorcentagens < 1 && custo > 0) {
    precoVendaIdeal = custo / (1 - somaPorcentagens);
  } else if (custo > 0) {
    precoVendaIdeal = custo * (1 + margemDesejada / 100);
  }

  // CÁLCULO DE DESCONTOS E LUCROS REAL
  const valorTaxaRetida = precoVendaIdeal * (taxaMaquininha / 100);
  const valorRecebidoLiquido = precoVendaIdeal - valorTaxaRetida;
  const lucroLiquidoReal = valorRecebidoLiquido - custo;

  // CÁLCULO DO PREÇO À VISTA COM DESCONTO PIX
  const precoVendaPix = precoVendaIdeal * (1 - descPix / 100);
  const lucroLiquidoPix = precoVendaPix - custo;

  // TEXTO DE ORÇAMENTO/RESUMO
  const gerarTextoResumo = () => {
    let msg = `🛍️ *TABELA DE PREÇO & PRECIFICAÇÃO*\n`;
    if (nomeProduto.trim()) msg += `📦 *Produto/Item:* ${nomeProduto}\n\n`;
    msg += `💳 *Cartão (${modalidadePagamento.toUpperCase()}):* R$ ${formatarMoeda(precoVendaIdeal)}\n`;
    if (descPix > 0) {
      msg += `⚡ *No PIX/Dinheiro (${descPix}% de desc.):* *R$ ${formatarMoeda(precoVendaPix)}*\n`;
    }
    msg += `\n💬 Dúvidas ou encomendas? Entre em contato conosco!`;
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
            onClick={() => navigate('/ferramentas')} 
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Ferramenta de Vendas
          </span>
        </div>

        {/* BANNER DINÂMICO LOCAL */}
        <ToolBanner secao="calculadora_margem" />

        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Calculadora de Preço de Venda, Margem & Maquininhas
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Calcule o preço exato para vender seus produtos sem perder margem de lucro com taxas de cartão ou descontos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* PAINEL DE DADOS DO PRODUTO E TAXAS */}
          <Card className="border-border/60 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" /> Dados do Produto & Maquininha
              </CardTitle>
              <CardDescription className="text-xs">
                Informe os custos e selecione a maquininha usada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs font-semibold">Nome do Produto / Serviço (Opcional)</Label>
                <Input 
                  placeholder="Ex: Capa de Celular, Camiseta, Doce..." 
                  value={nomeProduto} 
                  onChange={e => setNomeProduto(e.target.value)} 
                  className="h-9 text-xs" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Custo do Produto (R$) *</Label>
                  <Input 
                    placeholder="Ex: 50,00" 
                    value={custoProduto} 
                    onChange={e => setCustoProduto(e.target.value)} 
                    className="h-9 text-xs" 
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Margem de Lucro Desejada (%)</Label>
                  <Input 
                    placeholder="Ex: 30" 
                    value={margemLucroDesejada} 
                    onChange={e => setMargemLucroDesejada(e.target.value)} 
                    className="h-9 text-xs" 
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Maquininha de Cartão</Label>
                <Select value={operadoraSelecionada} onValueChange={setOperadoraSelecionada}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(OPERADORAS).map(([key, item]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {item.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {operadoraSelecionada !== 'custom' ? (
                <div>
                  <Label className="text-xs font-semibold">Forma de Pagamento</Label>
                  <Select value={modalidadePagamento} onValueChange={setModalidadePagamento}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX na Maquininha ({OPERADORAS[operadoraSelecionada as keyof typeof OPERADORAS]?.pix}%)</SelectItem>
                      <SelectItem value="debito">Débito ({OPERADORAS[operadoraSelecionada as keyof typeof OPERADORAS]?.debito}%)</SelectItem>
                      <SelectItem value="cred1x">Crédito 1x ({OPERADORAS[operadoraSelecionada as keyof typeof OPERADORAS]?.cred1x}%)</SelectItem>
                      <SelectItem value="cred6x">Crédito 6x ({OPERADORAS[operadoraSelecionada as keyof typeof OPERADORAS]?.cred6x}%)</SelectItem>
                      <SelectItem value="cred12x">Crédito 12x ({OPERADORAS[operadoraSelecionada as keyof typeof OPERADORAS]?.cred12x}%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label className="text-xs font-semibold">Digite a Taxa do Cartão (%)</Label>
                  <Input 
                    placeholder="Ex: 4.99" 
                    value={taxaManual} 
                    onChange={e => setTaxaManual(e.target.value)} 
                    className="h-9 text-xs" 
                  />
                </div>
              )}

              <div>
                <Label className="text-xs font-semibold">Oferecer Desconto no PIX / Dinheiro (%)</Label>
                <Input 
                  placeholder="Ex: 5 ou 10" 
                  value={descontoPixPercentual} 
                  onChange={e => setDescontoPixPercentual(e.target.value)} 
                  className="h-9 text-xs" 
                />
              </div>
            </CardContent>
          </Card>

          {/* PAINEL DE RESULTADOS & PREÇO RECOMENDADO */}
          <div className="space-y-4">
            
            <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-lg">
              <CardContent className="p-6 space-y-4 text-center">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Preço Ideal de Venda Recomendado
                </span>
                <h2 className="text-4xl font-black text-foreground">
                  R$ {formatarMoeda(precoVendaIdeal)}
                </h2>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-left text-xs">
                  <div className="p-2 bg-background/60 rounded-lg border border-border/40">
                    <span className="text-muted-foreground block text-[10px]">Lucro Líquido no Bolso:</span>
                    <strong className="text-emerald-600 font-bold">R$ {formatarMoeda(lucroLiquidoReal)}</strong>
                  </div>
                  <div className="p-2 bg-background/60 rounded-lg border border-border/40">
                    <span className="text-muted-foreground block text-[10px]">Taxa da Maquininha ({taxaMaquininha}%):</span>
                    <strong className="text-rose-600 font-bold">R$ {formatarMoeda(valorTaxaRetida)}</strong>
                  </div>
                </div>

                {descPix > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block">
                      ⚡ Preço Promocional no PIX ({descPix}% desc.): R$ {formatarMoeda(precoVendaPix)}
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      Lucro Líquido no PIX: R$ {formatarMoeda(lucroLiquidoPix)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PRE-VISUALIZAÇÃO DO RESUMO */}
            <Card className="border-border/60 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Resumo de Valores para WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed bg-background p-3 rounded-lg border border-border/40">
                  {gerarTextoResumo()}
                </p>

                <div className="grid grid-cols-2 gap-3">
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

export default CalculadoraMargem;
