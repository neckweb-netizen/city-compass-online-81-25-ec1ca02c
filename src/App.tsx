import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { SecurityHeaders } from "@/components/security/SecurityHeaders";
import { lazy, Suspense, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Hammer, Clock, MapPin, Mail, MessageSquare, Instagram, Facebook, 
  ArrowRight, Sparkles, DollarSign, FileText, NotebookPen, Search, 
  ShieldCheck, Lock, Calculator, Percent 
} from "lucide-react";
import { initGA, logPageView } from "@/utils/analytics";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Import critical pages immediately
import Index from "./pages/Index";

// Lazy load non-critical pages
const SearchPage = lazy(() => import("./pages/Search"));
const Locais = lazy(() => import("./pages/Locais"));
const AchadosPerdidos = lazy(() => import("./pages/AchadosPerdidos"));
const LocalProfile = lazy(() => import("./pages/LocalProfile"));
const Eventos = lazy(() => import("./pages/Eventos"));
const EventoPage = lazy(() => import("./pages/EventoPage"));
const CanalInformativo = lazy(() => import("./pages/CanalInformativo"));
const Oportunidades = lazy(() => import("./pages/Oportunidades"));
const VagasEmprego = lazy(() => import("./pages/VagasEmprego"));
const ServicosAutonomos = lazy(() => import("./pages/ServicosAutonomos"));
const AnunciarServico = lazy(() => import("./pages/AnunciarServico"));
const Radios = lazy(() => import("./pages/Radios"));
const Categorias = lazy(() => import("./pages/Categorias"));
const CategoriaLocais = lazy(() => import("./pages/CategoriaLocais"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const LocalDashboard = lazy(() => import("./pages/LocalDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const UnauthorizedPage = lazy(() => import("./pages/UnauthorizedPage"));
const Busca = lazy(() => import("./pages/Busca"));
const CadastroLocal = lazy(() => import("./pages/CadastroLocal"));
const Profile = lazy(() => import("./pages/Profile"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const ContactPage = lazy(() => import("./pages/ContactPage").then(m => ({ default: m.ContactPage })));
const AnuncieGratis = lazy(() => import("./pages/AnuncieGratis").then(m => ({ default: m.AnuncieGratis })));

// NOVO: Importações Lazy Load das ferramentas públicas e jogos
const Domino = lazy(() => import("./pages/Domino"));
const GeradorCobranca = lazy(() => import("./pages/ferramentas/GeradorCobranca").then(m => ({ default: m.GeradorCobranca })));
const CriadorCurriculo = lazy(() => import("./pages/ferramentas/CriadorCurriculo").then(m => ({ default: m.CriadorCurriculo })));
const GestaoCobrancas = lazy(() => import("./pages/ferramentas/GestaoCobrancas").then(m => ({ default: m.GestaoCobrancas })));
const CalculadoraOrcamento = lazy(() => import("./pages/ferramentas/CalculadoraOrcamento").then(m => ({ default: m.CalculadoraOrcamento })));
const CalculadoraMargem = lazy(() => import("./pages/ferramentas/CalculadoraMargem").then(m => ({ default: m.CalculadoraMargem })));

// Lazy load all admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminAchadosPerdidos = lazy(() => import("./pages/admin/AdminAchadosPerdidos"));
const AdminLocais = lazy(() => import("./pages/admin/AdminLocais"));
const AdminLocaisPendentes = lazy(() => import("./pages/admin/AdminLocaisPendentes"));
const AdminLocalAdmins = lazy(() => import("./pages/admin/AdminLocalAdmins"));
const AdminEventos = lazy(() => import("./pages/admin/AdminEventos").then(m => ({ default: m.AdminEventos })));
const AdminCidades = lazy(() => import("./pages/admin/AdminCidades").then(m => ({ default: m.AdminCidades })));
const AdminCategorias = lazy(() => import("./pages/admin/AdminCategorias").then(m => ({ default: m.AdminCategorias })));
const AdminUsuarios = lazy(() => import("./pages/admin/AdminUsuarios").then(m => ({ default: m.AdminUsuarios })));
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners"));
const AdminCanalInformativo = lazy(() => import("./pages/admin/AdminCanalInformativo").then(m => ({ default: m.AdminCanalInformativo })));
const AdminStories = lazy(() => import("./pages/admin/AdminStories").then(m => ({ default: m.AdminStories })));
const AdminCupons = lazy(() => import("./pages/admin/AdminCupons").then(m => ({ default: m.AdminCupons })));
const AdminPlanos = lazy(() => import("./pages/admin/AdminPlanos").then(m => ({ default: m.AdminPlanos })));
const AdminAvaliacoes = lazy(() => import("./pages/admin/AdminAvaliacoes").then(m => ({ default: m.AdminAvaliacoes })));
const AdminEstatisticas = lazy(() => import("./pages/admin/AdminEstatisticas").then(m => ({ default: m.AdminEstatisticas })));
const AdminConfiguracoes = lazy(() => import("./pages/admin/AdminConfiguracoes").then(m => ({ default: m.AdminConfiguracoes })));
const AdminHomeSections = lazy(() => import("./pages/admin/AdminHomeSections").then(m => ({ default: m.AdminHomeSections })));
const AdminMenu = lazy(() => import("./pages/admin/AdminMenu").then(m => ({ default: m.AdminMenu })));
const AdminAvisos = lazy(() => import("./pages/admin/AdminAvisos").then(m => ({ default: m.AdminAvisos })));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs").then(m => ({ default: m.AdminLogs })));
const AdminSecurity = lazy(() => import("./pages/admin/AdminSecurity").then(m => ({ default: m.AdminSecurity })));
const AdminDiagnostic = lazy(() => import("./pages/AdminDiagnostic"));
const AdminVagas = lazy(() => import("./pages/admin/AdminVagas").then(m => ({ default: m.AdminVagas })));
const AdminServicos = lazy(() => import("./pages/admin/AdminServicos").then(m => ({ default: m.AdminServicos })));
const AdminLugaresPublicos = lazy(() => import("./pages/admin/AdminLugaresPublicos"));
const AdminEnquetes = lazy(() => import("./pages/admin/AdminEnquetes"));
const Reclamacoes = lazy(() => import("./pages/ProblemasCidade"));
const ReclamacaoDetalhes = lazy(() => import("./pages/ProblemaDetalhes"));
const AdminReclamacoes = lazy(() => import("./pages/admin/AdminProblemasCidade"));
const AdminComentariosProblema = lazy(() => import("./pages/admin/AdminComentariosProblema"));
const ShortUrlRedirect = lazy(() => import("./pages/ShortUrlRedirect"));
const AdminGoogleImporter = lazy(() => import("./components/admin/GoogleImporter"));

import { MainLayout } from "./components/layout/MainLayout";
import { PublicLayout } from "./components/layout/PublicLayout";
import { AdminLayout } from "./components/admin/AdminLayout";
import { RoutePreloader } from "./components/layout/RoutePreloader";

// PÁGINA DO CATÁLOGO DE FERRAMENTAS
const FerramentasCatalogInternal = () => {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');

  const ferramentas = [
    {
      id: 'gerador-cobranca',
      titulo: 'Gerador de Cobrança PIX',
      descricao: 'Crie mensagens de cobrança amigáveis ou formais pré-formatadas para enviar no WhatsApp em segundos.',
      icone: DollarSign,
      rota: '/ferramentas/gerador-cobranca',
      categoria: 'Financeiro',
      corGradiente: 'from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500/30',
      corTexto: 'text-emerald-500',
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
    },
    {
      id: 'calculadora-orcamento',
      titulo: 'Calculadora de Hora & Orçamentos',
      descricao: 'Descubra quanto cobrar por hora de trabalho e crie orçamentos detalhados para enviar direto ao seu cliente.',
      icone: Calculator,
      rota: '/ferramentas/calculadora-orcamento',
      categoria: 'Precificação',
      corGradiente: 'from-purple-500/20 via-purple-500/5 to-transparent border-purple-500/30',
      corTexto: 'text-purple-500',
    },
    {
      id: 'calculadora-margem',
      titulo: 'Calculadora de Margem & Maquininha',
      descricao: 'Simule taxas das principais maquininhas de cartão, defina sua margem de lucro e encontre o preço de venda ideal.',
      icone: Percent,
      rota: '/ferramentas/calculadora-margem',
      categoria: 'Comércio',
      corGradiente: 'from-pink-500/20 via-pink-500/5 to-transparent border-pink-500/30',
      corTexto: 'text-pink-500',
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
                        <Badge className="bg-primary/20 text-primary text-[10px] font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Membros
                        </Badge>
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

        {/* INFORMATIVO DE SEGURANÇA */}
        <div className="p-4 bg-muted/30 border border-border/60 rounded-2xl text-center flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Todas as suas informações registradas nas ferramentas são 100% privadas e armazenadas com segurança.</span>
        </div>

      </div>
    </div>
  );
};

// Optimized loading component with minimal DOM and skeleton
const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <div className="text-sm text-muted-foreground">Carregando...</div>
    </div>
  </div>
);

// Componente interno responsável por mapear as trocas de tela do roteador e enviar ao GA4
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    logPageView(location.pathname + location.search);
  }, [location]);

  return null;
};

const App = () => {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Inicialização única do Google Analytics 4
  useEffect(() => {
    initGA();
  }, []);

  // Monitoramento ativo e assíncrono do status de manutenção global
  useEffect(() => {
    const verificarManutencao = async () => {
      try {
        const { data, error } = await supabase
          .from("configuracoes_sistema" as any)
          .select("manutencao, mensagem_manutencao")
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setIsMaintenance(data.manutencao ?? false);
          setMaintenanceMessage(data.mensagem_manutencao ?? "O portal está passando por updates e voltará em breve.");
        }
      } catch (error) {
        console.error("Erro ao sincronizar chaves de manutenção no App:", error);
      } finally {
        setLoadingConfig(false);
      }
    };

    verificarManutencao();

    // Sincronização em tempo real das tabelas operacionais
    const channel = supabase
      .channel("schema-db-maintenance-app")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "configuracoes_sistema" },
        (payload) => {
          if (payload && payload.new) {
            setIsMaintenance(payload.new.manutencao ?? false);
            setMaintenanceMessage(payload.new.mensagem_manutencao ?? "O portal está passando por atualizações.");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Interceptação com a Landing Page Corporativa Profissional
  if (!loadingConfig && isMaintenance && !window.location.pathname.startsWith("/admin")) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#0F0A19] text-white relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />

        <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <img 
              src="/Logo.png" 
              alt="Saj Tem Logo" 
              className="h-9 w-auto object-contain max-w-[180px]" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent hidden sm:inline">
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
              <img src="" alt="" className="hidden" /><Instagram className="h-4 w-4" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="p-2 bg-purple-950/30 border border-purple-900/40 rounded-xl text-gray-400 hover:text-white hover:bg-purple-900/40 transition-all">
              <img src="" alt="" className="hidden" /><Facebook className="h-4 w-4" />
            </a>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <SecurityHeaders />
        <PWAInstallPrompt />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnalyticsTracker />
          <RoutePreloader />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<Index />} />
                <Route path="achados-e-perdidos" element={<AchadosPerdidos />} />
                <Route path="profile" element={<Profile />} />
                <Route path="configuracoes" element={<Configuracoes />} />
                <Route path="busca" element={<Busca />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="locais" element={<Locais />} />
                <Route path="categorias" element={<Categorias />} />
                <Route path="locais/:slug" element={<LocalProfile />} />
                <Route path="local/:slug" element={<LocalProfile />} />
                <Route path="cadastro-local" element={<CadastroLocal />} />
                <Route path="eventos" element={<Eventos />} />
                <Route path="eventos/:id" element={<EventoPage />} />
                <Route path="evento/:id" element={<EventoPage />} />
                <Route path="canal-informativo" element={<CanalInformativo />} />
                <Route path="oportunidades" element={<Oportunidades />} />
                <Route path="oportunidades/vagas" element={<VagasEmprego />} />
                <Route path="oportunidades/servicos" element={<ServicosAutonomos />} />
                <Route path="oportunidades/anunciar-servico" element={<AnunciarServico />} />
                <Route path="radios" element={<Radios />} />
                <Route path="categoria/:slug" element={<CategoriaLocais />} />
                <Route path="help" element={<HelpCenter />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="privacy" element={<PrivacyPolicy />} />
                <Route path="anuncie-gratis" element={<AnuncieGratis />} />
                <Route path="reclamacoes" element={<Reclamacoes />} />
                <Route path="reclamacoes/:id" element={<ReclamacaoDetalhes />} />
                <Route path="unauthorized" element={<UnauthorizedPage />} />
                
                {/* ROTA ADICIONADA: Página pública de Dominó */}
                <Route path="domino" element={<Domino />} />

                {/* ROTA PÚBLICA DO CATÁLOGO DE FERRAMENTAS */}
                <Route path="ferramentas" element={<FerramentasCatalogInternal />} />

                {/* ROTAS PROTEGIDAS (RESTRITAS A USUÁRIOS LOGADOS) */}
                <Route path="ferramentas/gerador-cobranca" element={<ProtectedRoute><GeradorCobranca /></ProtectedRoute>} />
                <Route path="ferramentas/criador-curriculo" element={<ProtectedRoute><CriadorCurriculo /></ProtectedRoute>} />
                <Route path="ferramentas/gestao-cobrancas" element={<ProtectedRoute><GestaoCobrancas /></ProtectedRoute>} />
                <Route path="ferramentas/GestaoCobrancas" element={<ProtectedRoute><GestaoCobrancas /></ProtectedRoute>} />
                <Route path="ferramentas/calculadora-orcamento" element={<ProtectedRoute><CalculadoraOrcamento /></ProtectedRoute>} />
                <Route path="ferramentas/calculadora-margem" element={<ProtectedRoute><CalculadoraMargem /></ProtectedRoute>} />
                
                <Route path=":shortCode" element={<ShortUrlRedirect />} />
              </Route>

              <Route path="/empresa-dashboard" element={<MainLayout />}>
                <Route index element={<LocalDashboard />} />
              </Route>

              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="locais" element={<AdminLocais />} />
                <Route path="achados-e-perdidos" element={<AdminAchadosPerdidos />} />
                <Route path="locais-pendentes" element={<AdminLocaisPendentes />} />
                <Route path="local-admins" element={<AdminLocalAdmins />} />
                <Route path="eventos" element={<AdminEventos />} />
                <Route path="cidades" element={<AdminCidades />} />
                <Route path="categorias" element={<AdminCategorias />} />
                <Route path="usuarios" element={<AdminUsuarios />} />
                <Route path="banners" element={<AdminBanners />} />
                <Route path="canal-informativo" element={<AdminCanalInformativo />} />
                <Route path="stories" element={<AdminStories />} />
                <Route path="cupons" element={<AdminCupons />} />
                <Route path="planos" element={<AdminPlanos />} />
                <Route path="avaliacoes" element={<AdminAvaliacoes />} />
                <Route path="estatisticas" element={<AdminEstatisticas />} />
                <Route path="configuracoes" element={<AdminConfiguracoes />} />
                <Route path="home-sections" element={<AdminHomeSections />} />
                <Route path="menu" element={<AdminMenu />} />
                <Route path="avisos" element={<AdminAvisos />} />
                <Route path="logs" element={<AdminLogs />} />
                <Route path="security" element={<AdminSecurity />} />
                <Route path="diagnostic" element={<AdminDiagnostic />} />
                <Route path="vagas" element={<AdminVagas />} />
                <Route path="servicos" element={<AdminServicos />} />
                <Route path="lugares-publicos" element={<AdminLugaresPublicos />} />
                <Route path="enquetes" element={<AdminEnquetes />} />
                <Route path="reclamacoes" element={<AdminReclamacoes />} />
                <Route path="comentarios-problema" element={<AdminComentariosProblema />} />
                <Route path="importar-google" element={<AdminGoogleImporter />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  );
};

export default App;
