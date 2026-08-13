import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, DollarSign, Copy, Check, Send, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SafeHtml } from '@/components/security/SafeHtml';

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
            <SafeHtml
              key={b.id} 
              html={b.codigo_html}
              className="w-full rounded-2xl overflow-hidden shadow-sm border border-border/60 bg-card p-2 text-center"
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

export const GeradorCobranca = () => {
  const navigate = useNavigate();
  const [nomeCliente, setNomeCliente] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [tom, setTipoTom] = useState<'amigavel' | 'formal' | 'urgente'>('amigavel');
  const [copiado, setCopiado] = useState(false);

  const gerarMensagem = () => {
    const valorFmt = valor ? `R$ ${valor}` : 'o valor pendente';
    const descFmt = descricao ? ` referente a: ${descricao}` : '';
    const pixFmt = chavePix ? `\n\n🔑 *Chave PIX:* ${chavePix}` : '';

    if (tom === 'amigavel') {
      return `Olá, ${nomeCliente || 'cliente'}! Tudo bem? 😊\n\nPassando apenas para lembrar sobre o pagamento no valor de *${valorFmt}*${descFmt}.${pixFmt}\n\nQualquer dúvida, estou à disposição! Obrigado! 🙏`;
    } else if (tom === 'formal') {
      return `Prezado(a) ${nomeCliente || 'Cliente'},\n\nInformamos a pendência do valor de *${valorFmt}*${descFmt}.${pixFmt}\n\nSolicitamos a gentileza de realizar a quitação assim que possível. Permanecemos à disposição.`;
    } else {
      return `Atenção: Lembramos que o pagamento no valor de *${valorFmt}*${descFmt} está pendente.${pixFmt}\n\nPor favor, confirme o envio do comprovante assim que efetuado. Agradecemos a atenção!`;
    }
  };

  const mensagemFinal = gerarMensagem();

  const handleCopiar = () => {
    navigator.clipboard.writeText(mensagemFinal);
    setCopiado(true);
    toast.success('Mensagem de cobrança copiada!');
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleEnviarWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagemFinal)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/ferramentas')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar para Ferramentas
          </Button>
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1 text-xs font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Cobrança Express
          </Badge>
        </div>

        <ToolBanner secao="gerador_cobranca" />

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-foreground flex items-center justify-center gap-2">
            <DollarSign className="w-8 h-8 text-emerald-500" /> Gerador de Cobrança PIX
          </h1>
          <p className="text-muted-foreground text-sm">
            Crie mensagens de cobrança amigáveis ou formais pré-formatadas para enviar no WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border/60 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-bold">Dados da Cobrança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nome do Cliente</Label>
                <Input placeholder="Ex: João da Silva" value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Valor (R$)</Label>
                <Input placeholder="Ex: 150,00" value={valor} onChange={e => setValor(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Chave PIX</Label>
                <Input placeholder="CPF, Celular ou E-mail" value={chavePix} onChange={e => setChavePix(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Descrição do Serviço / Produto</Label>
                <Input placeholder="Ex: Manutenção de Ar Condicionado" value={descricao} onChange={e => setDescricao(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tom da Mensagem</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button type="button" variant={tom === 'amigavel' ? 'default' : 'outline'} size="sm" onClick={() => setTipoTom('amigavel')} className="text-xs h-8">
                    Amigável
                  </Button>
                  <Button type="button" variant={tom === 'formal' ? 'default' : 'outline'} size="sm" onClick={() => setTipoTom('formal')} className="text-xs h-8">
                    Formal
                  </Button>
                  <Button type="button" variant={tom === 'urgente' ? 'default' : 'outline'} size="sm" onClick={() => setTipoTom('urgente')} className="text-xs h-8">
                    Urgente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-md flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-base font-bold">Prévia da Mensagem</CardTitle>
              <CardDescription className="text-xs">Copie ou envie direto pelo WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
              <Textarea value={mensagemFinal} readOnly className="font-sans text-xs leading-relaxed min-h-[200px] bg-muted/30 resize-none p-3" />

              <div className="flex gap-2 pt-2">
                <Button onClick={handleCopiar} variant="outline" className="flex-1 gap-2 text-xs font-bold h-10">
                  {copiado ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
                </Button>

                <Button onClick={handleEnviarWhatsApp} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-bold h-10">
                  <Send className="w-4 h-4" />
                  <span>Enviar WhatsApp</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GeradorCobranca;
