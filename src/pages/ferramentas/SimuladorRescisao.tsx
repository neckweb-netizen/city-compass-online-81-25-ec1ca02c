import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileSpreadsheet, Sparkles } from 'lucide-react';
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

export const SimuladorRescisao = () => {
  const navigate = useNavigate();
  const [salarioBruto, setSalarioBruto] = useState('2000');
  const [mesesTrabalhados, setMesesTrabalhados] = useState('12');

  const salario = parseFloat(salarioBruto) || 0;
  const meses = parseInt(mesesTrabalhados) || 0;

  const decimoTerceiro = (salario / 12) * (meses % 12 || 12);
  const feriasProporcionais = (salario / 12) * (meses % 12 || 12);
  const umTercasFerias = feriasProporcionais / 3;
  const multaFgtsEstimada = (salario * 0.08 * meses) * 0.4;
  const totalEstimado = salario + decimoTerceiro + feriasProporcionais + umTercasFerias + multaFgtsEstimada;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/ferramentas')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar para Ferramentas
          </Button>
          <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20 px-3 py-1 text-xs font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Direitos CLT
          </Badge>
        </div>

        {/* BANNER DINÂMICO PARA SIMULADOR DE RESCISÃO */}
        <ToolBanner secao="simulador_rescisao" />

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-foreground flex items-center justify-center gap-2">
            <FileSpreadsheet className="w-8 h-8 text-cyan-500" /> Simulador de Rescisão (CLT)
          </h1>
          <p className="text-muted-foreground text-sm">Simule estimativas do seu acerto trabalhista com aviso prévio e multa do FGTS.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/60 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-bold">Dados do Contrato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Último Salário Bruto (R$)</Label>
                <Input value={salarioBruto} onChange={e => setSalarioBruto(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Meses Trabalhados na Empresa</Label>
                <Input value={mesesTrabalhados} onChange={e => setMesesTrabalhados(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-md bg-cyan-500/5 p-6 space-y-4 text-center flex flex-col justify-center">
            <div>
              <span className="text-xs font-extrabold uppercase text-cyan-600">Estimativa Total Bruta:</span>
              <strong className="text-3xl font-black text-cyan-700 block mt-1">R$ {totalEstimado.toFixed(2)}</strong>
            </div>
            <div className="border-t pt-3 text-xs text-muted-foreground space-y-1 text-left">
              <div className="flex justify-between"><span>13º Proporcional:</span><strong>R$ {decimoTerceiro.toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>Férias + 1/3:</span><strong>R$ {(feriasProporcionais + umTercasFerias).toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>Multa FGTS 40% (Est.):</span><strong>R$ {multaFgtsEstimada.toFixed(2)}</strong></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SimuladorRescisao;
