import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calculator, Sparkles } from 'lucide-react';
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

export const CalculadoraOrcamento = () => {
  const navigate = useNavigate();
  const [pretensaoMensal, setPretensaoMensal] = useState('3000');
  const [horasDia, setHorasDia] = useState('8');
  const [diasMes, setDiasMes] = useState('20');
  const [custosFixos, setCustosFixos] = useState('300');

  const valorPretensao = parseFloat(pretensaoMensal) || 0;
  const valorHoras = parseFloat(horasDia) || 1;
  const valorDias = parseFloat(diasMes) || 1;
  const valorCustos = parseFloat(custosFixos) || 0;

  const totalHorasMes = valorHoras * valorDias;
  const valorHoraIdeal = totalHorasMes > 0 ? (valorPretensao + valorCustos) / totalHorasMes : 0;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/ferramentas')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar para Ferramentas
          </Button>
          <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 px-3 py-1 text-xs font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Valor/Hora
          </Badge>
        </div>

        {/* BANNER DINÂMICO PARA CALCULADORA DE ORÇAMENTOS */}
        <ToolBanner secao="calculadora_orcamento" />

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-foreground flex items-center justify-center gap-2">
            <Calculator className="w-8 h-8 text-purple-500" /> Calculadora de Hora & Orçamentos
          </h1>
          <p className="text-muted-foreground text-sm">Descubra exatamente quanto cobrar por hora de trabalho freelance ou autônomo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/60 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-bold">Suas Metas e Horas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Quanto quer ganhar por mês (R$)</Label>
                <Input value={pretensaoMensal} onChange={e => setPretensaoMensal(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Horas trabalhadas por dia</Label>
                <Input value={horasDia} onChange={e => setHorasDia(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Dias trabalhados por mês</Label>
                <Input value={diasMes} onChange={e => setDiasMes(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Custos fixos mensais (Luz, Internet, Ferramentas)</Label>
                <Input value={custosFixos} onChange={e => setCustosFixos(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-md bg-purple-500/5 flex flex-col justify-center text-center p-6 space-y-4">
            <span className="text-xs uppercase font-extrabold text-purple-600 tracking-wider">Sua Hora de Trabalho Vale:</span>
            <strong className="text-4xl font-black text-purple-700">R$ {valorHoraIdeal.toFixed(2)}</strong>
            <p className="text-xs text-muted-foreground">
              Trabalhando {totalHorasMes} horas por mês para cobrir seus custos e alcançar sua meta de R$ {valorPretensao.toFixed(2)}.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalculadoraOrcamento;
