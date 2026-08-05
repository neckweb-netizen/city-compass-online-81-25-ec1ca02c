import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, DollarSign, FileText, NotebookPen, ArrowRight, 
  Search, ShieldCheck, Wrench, Lock 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Ferramenta {
  id: string;
  titulo: string;
  descricao: string;
  icone: any;
  rota: string;
  categoria: string;
  corGradiente: string;
  corTexto: string;
  exclusivoMembros: boolean;
}

export const FerramentasCatalog = () => {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');

  const ferramentas: Ferramenta[] = [
    {
      id: 'gerador-cobranca',
      titulo: 'Gerador de Cobrança PIX',
      descricao: 'Crie mensagens de cobrança amigáveis ou formais pré-formatadas para enviar no WhatsApp em segundos.',
      icone: DollarSign,
      rota: '/ferramentas/gerador-cobranca',
      categoria: 'Financeiro',
      corGradiente: 'from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500/30',
      corTexto: 'text-emerald-500',
      exclusivoMembros: true,
    },
    {
      id: 'criador-curriculo',
      titulo: 'Criador de Currículo PDF',
      descricao: 'Monte seu currículo profissional no formato padrão A4 e faça o download em PDF para enviar às vagas da região.',
      icone: FileText,
      rota: '/ferramentas/criador-curriculo',
      categoria: 'Carreira',
      corGradiente: 'from-blue-500/20 via-blue-500/5 to-transparent border-blue-500/30',
      corTexto: 'text-blue-500',
      exclusivoMembros: true,
    },
    {
      id: 'gestao-cobrancas',
      titulo: 'Caderno de Cobranças & Micro CRM',
      descricao: 'Gerencie clientes, controle quem te deve, valores a receber, datas de vencimento e histórico completo de cobranças.',
      icone: NotebookPen,
      rota: '/ferramentas/gestao-cobrancas',
      categoria: 'Gestão',
      corGradiente: 'from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/30',
      corTexto: 'text-amber-500',
      exclusivoMembros: true,
    },
  ];

  const ferramentasFiltradas = ferramentas.filter(f => 
    f.titulo.toLowerCase().includes(busca.toLowerCase()) || 
    f.descricao.toLowerCase().includes(busca.toLowerCase()) ||
    f.categoria.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HERO SECTION DAS FERRAMENTAS */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs uppercase tracking-wider font-bold inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Central de Utilitários SAJ TEM
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            Ferramentas Gratuitas para o Seu Dia a Dia
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Soluções práticas e inteligentes desenvolvidas para facilitar o trabalho de autônomos, profissionais e moradores de Santo Antônio de Jesus.
          </p>

          {/* BARRA DE PESQUISA */}
          <div className="relative max-w-md mx-auto pt-2">
            <Search className="w-4 h-4 absolute left-3.5 top-5 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar ferramenta..." 
              value={busca} 
              onChange={e => setBusca(e.target.value)} 
              className="pl-10 h-11 text-xs sm:text-sm rounded-xl border-border shadow-sm"
            />
          </div>
        </div>

        {/* GRID DE FERRAMENTAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {ferramentasFiltradas.map((item) => {
            const Icone = item.icone;
            return (
              <Card 
                key={item.id}
                className={`border bg-gradient-to-b ${item.corGradiente} shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group rounded-2xl overflow-hidden`}
              >
                <CardContent className="p-6 space-y-4 flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-2xl bg-background/80 border border-border shadow-sm ${item.corTexto}`}>
                        <Icone className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                          {item.categoria}
                        </Badge>
                        {item.exclusivoMembros && (
                          <Badge className="bg-primary/20 text-primary text-[10px] font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Membros
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {item.titulo}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.descricao}
                      </p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => navigate(item.rota)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 rounded-xl flex items-center justify-center gap-2 text-xs group-hover:translate-x-0.5 transition-all shadow-md mt-4"
                  >
                    <span>Acessar Ferramenta</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* RODAPÉ E INFORMATIVO DE SEGURANÇA */}
        <div className="p-4 bg-muted/30 border border-border/60 rounded-2xl text-center flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Todas as suas informações registradas nas ferramentas são 100% privadas e armazenadas com segurança.</span>
        </div>

      </div>
    </div>
  );
};

export default FerramentasCatalog;

