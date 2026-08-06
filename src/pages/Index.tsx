import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { HomeContent } from '@/components/home/HomeContent';
import { SearchContent } from '@/components/search/SearchContent';
import { CategoriesContent } from '@/components/categories/CategoriesContent';
import { CouponsContent } from '@/components/coupons/CouponsContent';
import { ProfileContent } from '@/components/profile/ProfileContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Hammer, 
  Clock, 
  MapPin, 
  Mail, 
  MessageSquare, 
  Instagram, 
  Facebook, 
  Globe, 
  ArrowRight,
  Search,
  Calendar,
  Tag,
  AlertCircle,
  Wrench,
  FileSpreadsheet,
  Percent,
  Volume2,
  FileText
} from 'lucide-react';

interface ItemAchadoPerdido {
  id: string;
  tipo: 'perdido' | 'encontrado';
  titulo: string;
  descricao: string;
  categoria: string;
  local_fato: string;
  created_at: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'home';
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  // Estados de controle para o Modo Manutenção
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Estado para armazenar os itens recentes de achados e perdidos
  const [itensAchados, setItensAchados] = useState<ItemAchadoPerdido[]>([]);
  const [loadingAchados, setLoadingAchados] = useState(false);

  // As 4 ferramentas principais em destaque para a Home
  const ferramentasDestaque = [
    {
      id: 'simulador-rescisao',
      titulo: 'Simulador de Rescisão (CLT)',
      descricao: 'Calcule aviso prévio, férias, 13º e multa do FGTS em segundos.',
      icone: FileSpreadsheet,
      rota: '/ferramentas/simulador-rescisao',
      tag: 'Novo',
      corTexto: 'text-cyan-500',
      corBg: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      id: 'calculadora-margem',
      titulo: 'Calculadora de Maquininha',
      descricao: 'Descubra o preço ideal de venda considerando as taxas dos cartões.',
      icone: Percent,
      rota: '/ferramentas/calculadora-margem',
      tag: 'Mais Usado',
      corTexto: 'text-pink-500',
      corBg: 'bg-pink-500/10 border-pink-500/20',
    },
    {
      id: 'leitor-voz',
      titulo: 'Leitor de Texto em Voz Alta',
      descricao: 'Converta qualquer texto em áudio narrado com voz natural e ajustes.',
      icone: Volume2,
      rota: '/ferramentas/leitor-voz',
      tag: 'IA Grátis',
      corTexto: 'text-indigo-500',
      corBg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      id: 'criador-curriculo',
      titulo: 'Criador de Currículo PDF',
      descricao: 'Monte seu currículo profissional no formato padrão A4 para download.',
      icone: FileText,
      rota: '/ferramentas/criador-curriculo',
      tag: 'Útil',
      corTexto: 'text-blue-500',
      corBg: 'bg-blue-500/10 border-blue-500/20',
    },
  ];

  // Carrega e monitora o status de manutenção do banco de dados
  useEffect(() => {
    const verificarManutencao = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout Supabase')), 3000)
        );

        const fetchPromise = supabase
          .from('configuracoes_sistema' as any)
          .select('manutencao, mensagem_manutencao')
          .limit(1)
          .maybeSingle();

        const { data, error }: any = await Promise.race([fetchPromise, timeoutPromise]).catch(() => ({ data: null, error: null }));

        if (error) throw error;

        if (data) {
          setIsMaintenance(data.manutencao ?? false);
          setMaintenanceMessage(data.mensagem_manutencao ?? 'O portal está passando por atualizações e voltará em breve.');
        } else {
          setIsMaintenance(false);
        }
      } catch (error) {
        console.error('Erro ao buscar status de manutenção:', error);
        setIsMaintenance(false);
      } finally {
        setLoadingConfig(false);
      }
    };

    verificarManutencao();

    const channel = supabase
      .channel('schema-db-changes-index')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'configuracoes_sistema' },
        (payload) => {
          if (payload && payload.new) {
            setIsMaintenance(payload.new.manutencao ?? false);
            setMaintenanceMessage(payload.new.mensagem_manutencao ?? 'O portal está passando por atualizações.');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Carrega os últimos 3 itens de achados e perdidos aprovados
  useEffect(() => {
    const buscarUltimosAchados = async () => {
      if (activeTab !== 'home' || isMaintenance) return;
      try {
        setLoadingAchados(true);
        const { data, error } = await supabase
          .from('achados_perdidos' as any)
          .select('id, tipo, titulo, descricao, categoria, local_fato, created_at')
          .eq('status', 'aprovado')
          .order('created_at', { ascending: false })
          .limit(3);

        if (!error && data) {
          setItensAchados(data);
        }
      } catch (err) {
        console.error('Erro ao buscar itens de achados e perdidos na home:', err);
      } finally {
        setLoadingAchados(false);
      }
    };

    buscarUltimosAchados();
  }, [activeTab, isMaintenance]);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  if (loadingConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0A19] text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <p className="text-xs text-purple-400/80 font-medium tracking-widest uppercase">Sincronizando Ecossistema</p>
        </div>
      </div>
    );
  }

  if (isMaintenance) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#0F0A19] text-white relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />

        <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              SAJ <span className="text-purple-500">TEM</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-xs bg-purple-950/40 border border-purple-900/60 px-3 py-1.5 rounded-full text-purple-300 font-medium backdrop-blur-sm">
            <MapPin className="h-3.5 w-3.5 text-purple-400" />
            Santo Antônio de Jesus • BA
          </div>
        </header>

        <main className="w-full max-w-4xl mx-auto px-6 py-12 flex flex-col items-center justify-center flex-grow relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full text-amber-400 text-xs font-semibold uppercase tracking-wider mb-8 animate-pulse">
            <Clock className="h-3.5 w-3.5" />
            Melhorias Estruturais em Andamento
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-2xl leading-[1.1] mb-6">
            Estamos a preparar algo <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-indigo-400 bg-clip-text text-transparent">incrível</span> para si.
          </h1>
          
          <p className="text-gray-400 text-base sm:text-lg max-w-xl leading-relaxed mb-10">
            {maintenanceMessage} O nosso guia comercial está a receber uma atualização nos servidores para melhorar a velocidade das pesquisas comerciais da região.
          </p>

          <div className="w-full max-w-md bg-purple-950/30 border border-purple-900/40 rounded-2xl p-4 mb-12 backdrop-blur-sm">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-purple-400 flex items-center gap-1.5">
                <Hammer className="h-3.5 w-3.5 animate-spin" /> Otimização do Banco de Dados
              </span>
              <span className="text-purple-300">85% Concluído</span>
            </div>
            <div className="w-full h-2.5 bg-[#171026] rounded-full overflow-hidden p-0.5 border border-purple-900/20">
              <div className="h-full w-[85%] bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full animate-pulse shadow-md shadow-purple-500/20" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl text-left">
            <div className="bg-[#150F22]/60 border border-purple-900/30 p-5 rounded-2xl backdrop-blur-sm hover:border-purple-800/40 transition-colors">
              <h3 className="font-bold text-sm text-white mb-1 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-400" /> Precisa de anunciar hoje?
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                A nossa equipa comercial continua a registar novas empresas localmente sem interrupções.
              </p>
              <a 
                href="https://wa.me/5575999999999" 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors group"
              >
                Falar com o Suporte <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>

            <div className="bg-[#150F22]/60 border border-purple-900/30 p-5 rounded-2xl backdrop-blur-sm hover:border-purple-800/40 transition-colors">
              <h3 className="font-bold text-sm text-white mb-1 flex items-center gap-2">
                <Mail className="h-4 w-4 text-purple-400" /> Contacto Institucional
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Para dúvidas, parcerias administrativas ou suporte a portais institucionais locais.
              </p>
              <span className="text-xs font-semibold text-gray-300 block">
                suporte.sajtem@gmail.com
              </span>
            </div>
          </div>
        </main>

        <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-purple-950/50 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 text-xs text-gray-500">
          <div>
            © {new Date().getFullYear()} Saj Tem. Todos os direitos reservados.
          </div>
          
          <div className="flex items-center gap-4">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="p-2 bg-purple-950/30 border border-purple-900/40 rounded-xl text-gray-400 hover:text-white hover:bg-purple-900/40 transition-all">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="p-2 bg-purple-950/30 border border-purple-900/40 rounded-xl text-gray-400 hover:text-white hover:bg-purple-900/40 transition-all">
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </footer>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-12">
            <HomeContent />
            
            {/* SEÇÃO DE FERRAMENTAS EM DESTAQUE NA HOME */}
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-background border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-4 mb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Wrench className="w-5 h-5" />
                      </span>
                      <h2 className="text-lg sm:text-xl font-bold text-foreground">
                        Utilitários Gratuitos em Destaque
                      </h2>
                    </div>
                    <p className="text-xs text-muted-foreground">Ferramentas práticas desenvolvidas para o seu dia a dia</p>
                  </div>
                  <Link
                    to="/ferramentas"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline transition-all group"
                  >
                    Ver todas as ferramentas <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {/* GRID DOS 4 CARDS DE FERRAMENTAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {ferramentasDestaque.map((item) => {
                    const Icone = item.icone;
                    return (
                      <Card 
                        key={item.id}
                        onClick={() => navigate(item.rota)}
                        className="border border-border/60 hover:border-primary/50 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group rounded-2xl overflow-hidden bg-card flex flex-col justify-between"
                      >
                        <CardContent className="p-5 space-y-4 flex flex-col justify-between h-full">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className={`p-3 rounded-2xl border ${item.corBg} ${item.corTexto} shadow-inner`}>
                                <Icone className="w-5 h-5" />
                              </div>
                              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-extrabold px-2 py-0.5 uppercase tracking-wider">
                                {item.tag}
                              </Badge>
                            </div>

                            <div className="space-y-1">
                              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                {item.titulo}
                              </h3>
                              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                                {item.descricao}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-xs font-bold text-primary pt-2 group-hover:translate-x-1 transition-transform">
                            <span>Acessar agora</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

              </div>
            </section>
            
            {/* Seção dinâmica de Achados e Perdidos adaptada ao Tema Claro/Escuro */}
            <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
              <div className="bg-background border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm">                
                
                {/* Header interno do Card */}
                <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                      <Search className="h-5 w-5 text-primary" /> Achados e Perdidos
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Utilidade pública em Santo Antônio de Jesus</p>
                  </div>
                  <Link
                    to="/achados-e-perdidos"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline transition-all group"
                  >
                    Ver todos <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {/* Grid de Itens internos */}
                {loadingAchados ? (
                  <div className="flex items-center justify-center py-10 gap-2">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-muted-foreground">Buscando itens...</span>
                  </div>
                ) : itensAchados.length === 0 ? (
                  <div className="text-center py-8 max-w-md mx-auto">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Nenhum objeto perdido ou achado publicado recentemente.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {itensAchados.map((item) => (
                      <Link
                        key={item.id}
                        to="/achados-e-perdidos"
                        className="bg-card text-card-foreground border border-border/40 rounded-2xl p-4 flex flex-col justify-between gap-4 shadow-sm hover:border-border/80 hover:shadow-md transition-all duration-200 group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                item.tipo === 'perdido'
                                  ? 'bg-destructive/10 text-destructive border-destructive/20'
                                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              }`}
                            >
                              {item.tipo === 'perdido' ? 'Perdido' : 'Achado'}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md">
                              <Tag className="h-2.5 w-2.5 text-muted-foreground/80" /> {item.categoria || "Geral"}
                            </span>
                          </div>
                          <h3 className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors duration-150 mb-1">
                            {item.titulo}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.descricao}
                          </p>
                        </div>

                        <div className="border-t border-border/40 pt-2.5 flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1 truncate max-w-[70%]">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                            <span className="truncate font-medium">{item.local_fato}</span>
                          </div>
                          <span className="text-[11px] text-muted-foreground/50 whitespace-nowrap">
                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

              </div>
            </section>
          </div>
        );
      case 'search':
        return <SearchContent />;
      case 'categories':
        return <CategoriesContent />;
      case 'coupons':
        return <CouponsContent />;
      case 'profile':
        return <ProfileContent />;
      default:
        return <HomeContent />;
    }
  };

  return (
    <div className="w-full max-w-none overflow-x-hidden">
      {renderContent()}
    </div>
  );
};

export default Index;
