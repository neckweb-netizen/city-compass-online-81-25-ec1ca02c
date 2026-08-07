import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Percent, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

export const CalculadoraMargem = () => {
  const navigate = useNavigate();
  const [custoProduto, setCustoProduto] = useState('50');
  const [margemLucro, setMargemLucro] = useState('30');
  const [taxaMaquininha, setTaxaMaquininha] = useState('4.99');

  const custo = parseFloat(custoProduto) || 0;
  const margem = parseFloat(margemLucro) || 0;
  const taxa = parseFloat(taxaMaquininha) || 0;

  const precoBase = custo * (1 + margem / 100);
  const precoVendaFinal = taxa < 100 ? precoBase / (1 - taxa / 100) : precoBase;
  const valorTaxa = precoVendaFinal * (taxa / 100);
  const lucroLiquido = precoVendaFinal - custo - valorTaxa;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/ferramentas')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar para Ferramentas
          </Button>
          <Badge className="bg-pink-500/10 text-pink-500 border-pink-500/20 px-3 py-1 text-xs font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Precificação
          </Badge>
        </div>

        {/* BANNER DINÂMICO PARA CALCULADORA DE MARGEM */}
        <ToolBanner secao="calculadora_margem" />

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-foreground flex items-center justify-center gap-2">
            <Percent className="w-8 h-8 text-pink-500" /> Calculadora de Margem & Maquininha
          </h1>
          <p className="text-muted-foreground text-sm">Simule as taxas do cartão e descubra o preço exato para ter lucro real.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/60 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-bold">Custo e Taxas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Custo de Compra do Produto (R$)</Label>
                <Input value={custoProduto} onChange={e => setCustoProduto(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Margem de Lucro Desejada (%)</Label>
                <Input value={margemLucro} onChange={e => setMargemLucro(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Taxa da Maquininha (%)</Label>
                <Input value={taxaMaquininha} onChange={e => setTaxaMaquininha(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-md bg-pink-500/5 p-6 space-y-4 text-center flex flex-col justify-center">
            <div>
              <span className="text-xs font-extrabold uppercase text-pink-600">Preço Sugerido de Venda:</span>
              <strong className="text-3xl font-black text-pink-700 block mt-1">R$ {precoVendaFinal.toFixed(2)}</strong>
            </div>
            <div className="border-t pt-3 text-xs text-muted-foreground space-y-1 text-left">
              <div className="flex justify-between"><span>Desconto da Maquininha:</span><strong className="text-destructive">R$ {valorTaxa.toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>Seu Lucro Líquido:</span><strong className="text-emerald-600">R$ {lucroLiquido.toFixed(2)}</strong></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalculadoraMargem;
