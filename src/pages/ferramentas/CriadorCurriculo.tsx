import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Download, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export const CriadorCurriculo = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('Santo Antônio de Jesus - BA');
  const [resumo, setResumo] = useState('');
  const [experiencia, setExperiencia] = useState('');
  const [formacao, setFormacao] = useState('');

  const handleImprimirPDF = () => {
    if (!nome) {
      toast.error('Informe pelo menos seu nome completo.');
      return;
    }
    window.print();
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white">
      <div className="max-w-4xl mx-auto space-y-6 print:max-w-none">
        <div className="flex items-center justify-between print:hidden">
          <Button variant="ghost" onClick={() => navigate('/ferramentas')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar para Ferramentas
          </Button>
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-3 py-1 text-xs font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> PDF A4
          </Badge>
        </div>

        <div className="print:hidden">
          <ToolBanner secao="criador_curriculo" />
        </div>

        <div className="text-center space-y-2 print:hidden">
          <h1 className="text-3xl font-extrabold text-foreground flex items-center justify-center gap-2">
            <FileText className="w-8 h-8 text-blue-500" /> Criador de Currículo PDF
          </h1>
          <p className="text-muted-foreground text-sm">
            Preencha seus dados para gerar um currículo no padrão profissional para enviar às empresas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:block">
          <Card className="border-border/60 shadow-md print:hidden">
            <CardHeader>
              <CardTitle className="text-base font-bold">Seus Dados Profissionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nome Completo *</Label>
                <Input placeholder="Ex: Maria dos Santos" value={nome} onChange={e => setNome(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Cargo / Área de Atuação</Label>
                <Input placeholder="Ex: Atendente de Loja / Auxiliar Administrativo" value={cargo} onChange={e => setCargo(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">E-mail</Label>
                  <Input placeholder="maria@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Telefone / WhatsApp</Label>
                  <Input placeholder="(75) 99999-9999" value={telefone} onChange={e => setTelefone(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Cidade / Estado</Label>
                <Input value={cidade} onChange={e => setCidade(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Resumo Profissional</Label>
                <Textarea placeholder="Breve resumo sobre suas habilidades e qualificações..." value={resumo} onChange={e => setResumo(e.target.value)} className="text-xs h-20" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Experiência Profissional</Label>
                <Textarea placeholder="Empresas onde trabalhou, cargos e períodos..." value={experiencia} onChange={e => setExperiencia(e.target.value)} className="text-xs h-24" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Formação Acadêmica & Cursos</Label>
                <Textarea placeholder="Ensino médio, faculdade, cursos técnicos..." value={formacao} onChange={e => setFormacao(e.target.value)} className="text-xs h-20" />
              </div>

              <Button onClick={handleImprimirPDF} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 gap-2 text-xs">
                <Download className="w-4 h-4" /> Baixar / Imprimir Currículo em PDF
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-md p-6 bg-white text-zinc-900 rounded-none print:shadow-none print:border-none print:p-0">
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">{nome || 'SEU NOME COMPLETO'}</h2>
                <p className="text-sm font-bold text-blue-600 uppercase">{cargo || 'CARGO PREVISTO'}</p>
                <div className="text-xs text-zinc-600 pt-1 flex flex-wrap gap-3">
                  {telefone && <span>📞 {telefone}</span>}
                  {email && <span>✉️ {email}</span>}
                  {cidade && <span>📍 {cidade}</span>}
                </div>
              </div>

              {resumo && (
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase text-zinc-800 border-b pb-0.5">Resumo Profissional</h3>
                  <p className="text-xs text-zinc-700 whitespace-pre-line leading-relaxed">{resumo}</p>
                </div>
              )}

              {experiencia && (
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase text-zinc-800 border-b pb-0.5">Experiência Profissional</h3>
                  <p className="text-xs text-zinc-700 whitespace-pre-line leading-relaxed">{experiencia}</p>
                </div>
              )}

              {formacao && (
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase text-zinc-800 border-b pb-0.5">Formação Acadêmica</h3>
                  <p className="text-xs text-zinc-700 whitespace-pre-line leading-relaxed">{formacao}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CriadorCurriculo;
