import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { SecurityHeaders } from "@/components/security/SecurityHeaders";
import { lazy, Suspense, useState, useEffect, useLayoutEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Hammer, Clock, MapPin, Mail, MessageSquare, Instagram, Facebook, 
  ArrowRight, Sparkles, DollarSign, FileText, NotebookPen, Search, 
  ShieldCheck, Globe, Calculator, Percent, FileSpreadsheet, Volume2, Grid, Ticket, CarFront, HeartPulse, WalletCards, Baby, Pill, ChevronLeft, ChevronRight
} from "lucide-react";
import { initGA, logPageView } from "@/utils/analytics";
import { trackToolView } from "@/lib/toolAnalytics";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PushNotificationsProvider } from "@/contexts/PushNotificationsContext";
import { PushPermissionPrompt } from "@/components/notifications/PushPermissionPrompt";

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
const Notifications = lazy(() => import("./pages/Notifications"));
const ContactPage = lazy(() => import("./pages/ContactPage").then(m => ({ default: m.ContactPage })));
const AnuncieGratis = lazy(() => import("./pages/AnuncieGratis").then(m => ({ default: m.AnuncieGratis })));

// Ferramentas públicas e jogos
const Domino = lazy(() => import("./pages/Domino"));
const GeradorCobranca = lazy(() => import("./pages/ferramentas/GeradorCobranca").then(m => ({ default: m.GeradorCobranca })));
const CriadorCurriculo = lazy(() => import("./pages/ferramentas/CriadorCurriculo").then(m => ({ default: m.CriadorCurriculo })));
const GestaoCobrancas = lazy(() => import("./pages/ferramentas/GestaoCobrancas").then(m => ({ default: m.GestaoCobrancas })));
const CalculadoraOrcamento = lazy(() => import("./pages/ferramentas/CalculadoraOrcamento").then(m => ({ default: m.CalculadoraOrcamento })));
const CalculadoraMargem = lazy(() => import("./pages/ferramentas/CalculadoraMargem").then(m => ({ default: m.CalculadoraMargem })));
const SimuladorRescisao = lazy(() => import("./pages/ferramentas/SimuladorRescisao").then(m => ({ default: m.SimuladorRescisao })));
const LeitorVoz = lazy(() => import("./pages/ferramentas/LeitorVoz").then(m => ({ default: m.LeitorVoz })));
const GeradorRifa = lazy(() => import("./pages/ferramentas/GeradorRifa").then(m => ({ default: m.GeradorRifa })));
const ConsultaFipe = lazy(() => import("./pages/ferramentas/ConsultaFipe").then(m => ({ default: m.ConsultaFipe })));
const CicloMenstrual = lazy(() => import("./pages/ferramentas/CicloMenstrual"));
const ControleFinanceiro = lazy(() => import("./pages/ferramentas/ControleFinanceiro").then(m => ({ default: m.ControleFinanceiro })));
const AcompanhamentoGestacional = lazy(() => import("./pages/ferramentas/AcompanhamentoGestacional"));
const MedicamentosLembretes = lazy(() => import("./pages/ferramentas/MedicamentosLembretes"));
const MeuVeiculo = lazy(() => import("./pages/ferramentas/MeuVeiculo"));

// Admin pages com resolução resiliente do AdminBanners
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminAchadosPerdidos = lazy(() => import("./pages/admin/AdminAchadosPerdidos"));
const AdminLocais = lazy(() => import("./pages/admin/AdminLocais"));
const AdminLocaisPendentes = lazy(() => import("./pages/admin/AdminLocaisPendentes"));
const AdminLocalAdmins = lazy(() => import("./pages/admin/AdminLocalAdmins"));
const AdminEventos = lazy(() => import("./pages/admin/AdminEventos").then(m => ({ default: m.AdminEventos })));
const AdminCidades = lazy(() => import("./pages/admin/AdminCidades").then(m => ({ default: m.AdminCidades })));
const AdminCategorias = lazy(() => import("./pages/admin/AdminCategorias").then(m => ({ default: m.AdminCategorias })));
const AdminUsuarios = lazy(() => import("./pages/admin/AdminUsuarios").then(m => ({ default: m.AdminUsuarios })));
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners").then(m => ({ default: m.AdminBanners })));
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

// GARANTE QUE TODA NOVA ROTA ABRA NO TOPO DA PÁGINA
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    // Cancela qualquer restauração automática de posição feita pelo navegador
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Força o topo imediatamente ao trocar de rota
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Alguns navegadores mobile restauram o scroll depois do primeiro paint.
    // Reforçamos no próximo frame para evitar a página abrindo no meio.
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
};

// COMPONENTE DE BANNER DINÂMICO PARA FERRAMENTAS
const BannersFerramentas = () => {
  const [banners, setBanners] = useState<any[]>([]);

  useEffect(() => {
    const buscarBanners = async () => {
      try {
        const { data } = await supabase
          .from("banners" as any)
          .select("*")
          .eq("ativo", true)
          .order("ordem", { ascending: true });

        if (data && data.length > 0) {
          setBanners(data);
        }
      } catch (err) {
        console.error("Erro ao buscar banners para ferramentas:", err);
      }
    };

    buscarBanners();
  }, []);

  if (banners.length === 0) return null;

  return (
    <div className="w-full space-y-3">
      {banners.map((b) => (
        <a
          key={b.id}
          href={b.link_destino || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-2xl overflow-hidden shadow-sm border border-border/60 hover:opacity-95 transition-opacity"
        >
          <img
            src={b.imagem_url || b.imagem}
            alt={b.titulo || "Banner de Anúncio"}
            className="w-full h-auto max-h-[160px] sm:max-h-[220px] object-cover"
          />
        </a>
      ))}
    </div>
  );
};

// CATÁLOGO DE FERRAMENTAS COM BANNERS DE ANÚNCIO
const FerramentasCatalogInternal = () => {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('Todas');
  const categoriasCarouselRef = useRef<HTMLDivElement>(null);

  const ferramentas = [
    {
      id: 'gerador-rifa',
      titulo: 'Gerador & Caderno de Rifas',
      descricao: 'Crie rifas personalizadas, controle pagamentos de números e compartilhe o link público com compradores.',
      icone: Ticket,
      rota: '/ferramentas/gerador-rifa',
      categoria: 'Sorteios',
      corGradiente: 'from-orange-500/20 via-orange-500/5 to-transparent border-orange-500/30',
      corTexto: 'text-orange-500',
    },
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
    {
      id: 'simulador-rescisao',
      titulo: 'Simulador de Rescisão (CLT)',
      descricao: 'Simule seus direitos trabalhistas, aviso prévio, férias proporcionais, 13º e multa do FGTS de forma simples.',
      icone: FileSpreadsheet,
      rota: '/ferramentas/simulador-rescisao',
      categoria: 'Trabalho',
      corGradiente: 'from-cyan-500/20 via-cyan-500/5 to-transparent border-cyan-500/30',
      corTexto: 'text-cyan-500',
    },
    {
      id: 'leitor-voz',
      titulo: 'Leitor de Texto em Voz Alta',
      descricao: 'Converta qualquer texto em áudio narrado com ajuste de tom, velocidade e voz em tempo real.',
      icone: Volume2,
      rota: '/ferramentas/leitor-voz',
      categoria: 'Acessibilidade',
      corGradiente: 'from-indigo-500/20 via-indigo-500/5 to-transparent border-indigo-500/30',
      corTexto: 'text-indigo-500',
    },
    {
      id: 'ciclo-menstrual',
      titulo: 'Calendário de Ciclo Menstrual',
      descricao: 'Acompanhe menstruação, sintomas, janela fértil e ovulação estimadas com calendário e histórico privado no aparelho.',
      icone: HeartPulse,
      rota: '/ferramentas/ciclo-menstrual',
      categoria: 'Saúde',
      corGradiente: 'from-rose-500/20 via-rose-500/5 to-transparent border-rose-500/30',
      corTexto: 'text-rose-500',
    },
    {
      id: 'controle-financeiro',
      titulo: 'Controle Financeiro Pessoal',
      descricao: 'Organize receitas, despesas, contas a vencer, calendário financeiro, orçamento e metas com dados privados no aparelho.',
      icone: WalletCards,
      rota: '/ferramentas/controle-financeiro',
      categoria: 'Financeiro',
      corGradiente: 'from-emerald-500/20 via-teal-500/5 to-transparent border-emerald-500/30',
      corTexto: 'text-emerald-600',
    },
    {
      id: 'acompanhamento-gestacional',
      titulo: 'Acompanhamento Gestacional',
      descricao: 'Acompanhe semanas, DPP, agenda de consultas e exames, diário de sintomas e marcos da gestação com sincronização na sua conta.',
      icone: Baby,
      rota: '/ferramentas/acompanhamento-gestacional',
      categoria: 'Saúde',
      corGradiente: 'from-fuchsia-500/20 via-rose-500/5 to-transparent border-fuchsia-500/30',
      corTexto: 'text-fuchsia-600',
    },
    {
      id: 'medicamentos',
      titulo: 'Medicamentos e Lembretes',
      descricao: 'Organize medicamentos e horários, registre doses e receba lembretes automáticos pelo Firebase com sincronização na sua conta.',
      icone: Pill,
      rota: '/ferramentas/medicamentos',
      categoria: 'Saúde',
      corGradiente: 'from-violet-500/20 via-indigo-500/5 to-transparent border-violet-500/30',
      corTexto: 'text-violet-600',
    },
    {
      id: 'meu-veiculo',
      titulo: 'Meu Veículo — Controle Automotivo',
      descricao: 'Controle abastecimentos, consumo, gastos, manutenções, documentos e receba lembretes automáticos pelo Firebase.',
      icone: CarFront,
      rota: '/ferramentas/meu-veiculo',
      categoria: 'Veículos',
      corGradiente: 'from-blue-500/20 via-sky-500/5 to-transparent border-blue-500/30',
      corTexto: 'text-blue-600',
    },
    {
      id: 'consulta-fipe',
      titulo: 'Consulta Tabela FIPE',
      descricao: 'Consulte o valor atualizado de carros, motos e caminhões por marca, modelo e ano.',
      icone: CarFront,
      rota: '/ferramentas/consulta-fipe',
      categoria: 'Veículos',
      corGradiente: 'from-sky-500/20 via-sky-500/5 to-transparent border-sky-500/30',
      corTexto: 'text-sky-500',
    },
  ];

  const categoriasUnicas = ['Todas', ...Array.from(new Set(ferramentas.map(f => f.categoria)))];

  const categoriaVisual: Record<string, { icone: typeof Grid; cor: string; fundo: string }> = {
    Todas: { icone: Grid, cor: 'text-violet-600 dark:text-violet-300', fundo: 'bg-violet-100 dark:bg-violet-950/50' },
    Sorteios: { icone: Ticket, cor: 'text-orange-600 dark:text-orange-300', fundo: 'bg-orange-100 dark:bg-orange-950/50' },
    Financeiro: { icone: WalletCards, cor: 'text-emerald-600 dark:text-emerald-300', fundo: 'bg-emerald-100 dark:bg-emerald-950/50' },
    Carreira: { icone: FileText, cor: 'text-blue-600 dark:text-blue-300', fundo: 'bg-blue-100 dark:bg-blue-950/50' },
    Gestão: { icone: NotebookPen, cor: 'text-amber-600 dark:text-amber-300', fundo: 'bg-amber-100 dark:bg-amber-950/50' },
    Precificação: { icone: Calculator, cor: 'text-purple-600 dark:text-purple-300', fundo: 'bg-purple-100 dark:bg-purple-950/50' },
    Comércio: { icone: Percent, cor: 'text-pink-600 dark:text-pink-300', fundo: 'bg-pink-100 dark:bg-pink-950/50' },
    Trabalho: { icone: FileSpreadsheet, cor: 'text-cyan-600 dark:text-cyan-300', fundo: 'bg-cyan-100 dark:bg-cyan-950/50' },
    Acessibilidade: { icone: Volume2, cor: 'text-indigo-600 dark:text-indigo-300', fundo: 'bg-indigo-100 dark:bg-indigo-950/50' },
    Saúde: { icone: HeartPulse, cor: 'text-rose-600 dark:text-rose-300', fundo: 'bg-rose-100 dark:bg-rose-950/50' },
    Veículos: { icone: CarFront, cor: 'text-sky-600 dark:text-sky-300', fundo: 'bg-sky-100 dark:bg-sky-950/50' },
  };

  const scrollCategorias = (direction: 'left' | 'right') => {
    categoriasCarouselRef.current?.scrollBy({
      left: direction === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  };

  const ferramentasFiltradas = ferramentas.filter(f => {
    const bateTexto = 
      f.titulo.toLowerCase().includes(busca.toLowerCase()) || 
      f.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      f.categoria.toLowerCase().includes(busca.toLowerCase());

    const bateCategoria = categoriaAtiva === 'Todas' || f.categoria === categoriaAtiva;

    return bateTexto && bateCategoria;
  });

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* BANNERS DE ANÚNCIO (PUXADOS DO BANCO DE DADOS) */}
        <BannersFerramentas />

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

        <section className="relative mx-auto w-full max-w-6xl pt-1" aria-label="Categorias de ferramentas">
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <p className="text-sm font-black text-foreground">Explore por categoria</p>
              <p className="text-[11px] text-muted-foreground sm:text-xs">Arraste para o lado e escolha o que você precisa</p>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => scrollCategorias('left')}
                className="h-9 w-9 rounded-full bg-background shadow-sm"
                aria-label="Categorias anteriores"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => scrollCategorias('right')}
                className="h-9 w-9 rounded-full bg-background shadow-sm"
                aria-label="Próximas categorias"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-8 bg-gradient-to-r from-background to-transparent sm:block" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-8 bg-gradient-to-l from-background to-transparent sm:block" />

            <div
              ref={categoriasCarouselRef}
              className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-3 pt-1 scroll-smooth overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-8"
            >
              {categoriasUnicas.map((cat) => {
                const isSelected = categoriaAtiva === cat;
                const visual = categoriaVisual[cat] || categoriaVisual.Todas;
                const IconeCategoria = visual.icone;
                const quantidade = cat === 'Todas'
                  ? ferramentas.length
                  : ferramentas.filter((f) => f.categoria === cat).length;

                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setCategoriaAtiva(cat)}
                    className={`group min-w-[92px] snap-start rounded-2xl border px-2.5 py-3 text-center transition-all duration-200 sm:min-w-[108px] sm:px-3 sm:py-3.5 ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/15 -translate-y-0.5'
                        : 'border-border/70 bg-card text-foreground shadow-sm hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span className={`mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl transition-transform group-hover:scale-105 ${
                      isSelected ? 'bg-primary-foreground/15 text-primary-foreground' : `${visual.fundo} ${visual.cor}`
                    }`}>
                      <IconeCategoria className="h-5 w-5" />
                    </span>
                    <span className="block truncate text-[11px] font-extrabold sm:text-xs">{cat}</span>
                    <span className={`mt-0.5 block text-[9px] font-semibold ${isSelected ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>
                      {quantidade} {quantidade === 1 ? 'ferramenta' : 'ferramentas'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {ferramentasFiltradas.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Search className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
            <h3 className="text-base font-bold text-foreground">Nenhuma ferramenta encontrada</h3>
            <p className="text-xs text-muted-foreground">Tente buscar por outro termo ou mude a categoria selecionada.</p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => { setBusca(''); setCategoriaAtiva('Todas'); }}
              className="text-xs rounded-xl mt-2"
            >
              Limpar Filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
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
                          <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Público
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
        )}

        <div className="p-4 bg-muted/30 border border-border/60 rounded-2xl text-center flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Todas as suas informações registradas nas ferramentas são 100% privadas e armazenadas com segurança.</span>
        </div>

      </div>
    </div>
  );
};

const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <div className="text-sm text-muted-foreground">Carregando...</div>
    </div>
  </div>
);

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    logPageView(location.pathname + location.search);
    void trackToolView(location.pathname);
  }, [location]);

  return null;
};

const App = () => {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    initGA();
  }, []);

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

  if (!loadingConfig && isMaintenance && !window.location.pathname.startsWith("/admin")) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#0F0A19] text-white relative overflow-hidden font-sans">
        <div className="absolute top-[#10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[#10%] right-[-10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />

        <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <img 
              src="/icon-192.png"
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
          <ScrollToTop />
          <PushNotificationsProvider>
            <PushPermissionPrompt />
            <AnalyticsTracker />
            <RoutePreloader />
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<Index />} />
                <Route path="achados-e-perdidos" element={<AchadosPerdidos />} />
                <Route path="profile" element={<Profile />} />
                <Route path="configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
                <Route path="notificacoes" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
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
                
                <Route path="domino" element={<Domino />} />

                {/* CATÁLOGOS E FERRAMENTAS PÚBLICAS */}
                <Route path="ferramentas" element={<FerramentasCatalogInternal />} />
                <Route path="ferramentas/gerador-rifa" element={<GeradorRifa />} />
                <Route path="ferramentas/ciclo-menstrual" element={<CicloMenstrual />} />
                <Route path="ferramentas/controle-financeiro" element={<ControleFinanceiro />} />
                <Route path="ferramentas/acompanhamento-gestacional" element={<AcompanhamentoGestacional />} />
                <Route path="ferramentas/medicamentos" element={<MedicamentosLembretes />} />
                <Route path="ferramentas/meu-veiculo" element={<MeuVeiculo />} />

                {/* FERRAMENTAS PROTEGIDAS */}
                <Route path="ferramentas/gerador-cobranca" element={<ProtectedRoute><GeradorCobranca /></ProtectedRoute>} />
                <Route path="ferramentas/criador-curriculo" element={<ProtectedRoute><CriadorCurriculo /></ProtectedRoute>} />
                <Route path="ferramentas/gestao-cobrancas" element={<ProtectedRoute><GestaoCobrancas /></ProtectedRoute>} />
                <Route path="ferramentas/GestaoCobrancas" element={<ProtectedRoute><GestaoCobrancas /></ProtectedRoute>} />
                <Route path="ferramentas/calculadora-orcamento" element={<ProtectedRoute><CalculadoraOrcamento /></ProtectedRoute>} />
                <Route path="ferramentas/calculadora-margem" element={<ProtectedRoute><CalculadoraMargem /></ProtectedRoute>} />
                <Route path="ferramentas/simulador-rescisao" element={<ProtectedRoute><SimuladorRescisao /></ProtectedRoute>} />
                <Route path="ferramentas/leitor-voz" element={<ProtectedRoute><LeitorVoz /></ProtectedRoute>} />
                <Route path="ferramentas/consulta-fipe" element={<ProtectedRoute><ConsultaFipe /></ProtectedRoute>} />
                
                <Route path="s/:shortCode" element={<ShortUrlRedirect />} />
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
          </PushNotificationsProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  );
};

export default App;

