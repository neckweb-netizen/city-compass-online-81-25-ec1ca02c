import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Volume2, Play, Square, Sparkles } from 'lucide-react';
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

export const LeitorVoz = () => {
  const navigate = useNavigate();
  const [texto, setTexto] = useState('');
  const [falando, setFalando] = useState(false);

  const handleFalar = () => {
    if (!texto.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'pt-BR';
    utterance.onend = () => setFalando(false);
    setFalando(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleParar = () => {
    window.speechSynthesis.cancel();
    setFalando(false);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/ferramentas')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar para Ferramentas
          </Button>
          <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 px-3 py-1 text-xs font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Voz em Tempo Real
          </Badge>
        </div>

        {/* BANNER DINÂMICO PARA LEITOR DE VOZ */}
        <ToolBanner secao="leitor_voz" />

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-foreground flex items-center justify-center gap-2">
            <Volume2 className="w-8 h-8 text-indigo-500" /> Leitor de Texto em Voz Alta
          </h1>
          <p className="text-muted-foreground text-sm">Cole ou digite qualquer texto para ouvir a narração em áudio.</p>
        </div>

        <Card className="border-border/60 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold">Digite seu Texto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Cole aqui a notícia, comunicado ou mensagem para narrar em voz alta..."
              value={texto}
              onChange={e => setTexto(e.target.value)}
              className="min-h-[180px] text-sm leading-relaxed"
            />

            <div className="flex gap-2">
              <Button onClick={handleFalar} disabled={falando || !texto.trim()} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 gap-2 text-xs">
                <Play className="w-4 h-4" /> Ouvir Narração
              </Button>
              {falando && (
                <Button onClick={handleParar} variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 font-bold h-10 gap-2 text-xs">
                  <Square className="w-4 h-4" /> Parar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeitorVoz;
