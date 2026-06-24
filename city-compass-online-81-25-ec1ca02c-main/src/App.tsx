import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { SecurityHeaders } from "@/components/security/SecurityHeaders";
import { lazy, Suspense } from "react";

// Import critical pages immediately
import Index from "./pages/Index";

// Lazy load non-critical pages
const Search = lazy(() => import("./pages/Search"));
const Locais = lazy(() => import("./pages/Locais"));
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

// Lazy load all admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
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

import { MainLayout } from "./components/layout/MainLayout";
import { PublicLayout } from "./components/layout/PublicLayout";
import { AdminLayout } from "./components/admin/AdminLayout";
import { RoutePreloader } from "./components/layout/RoutePreloader";

// Optimized loading component with minimal DOM and skeleton
const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <div className="text-sm text-muted-foreground">Carregando...</div>
    </div>
  </div>
);

const App = () => {
  return (
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <SecurityHeaders />
        <PWAInstallPrompt />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RoutePreloader />
          <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<Index />} />
              <Route path="profile" element={<Profile />} />
              <Route path="configuracoes" element={<Configuracoes />} />
              <Route path="busca" element={<Busca />} />
              <Route path="search" element={<Search />} />
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
              <Route path="reclamacoes" element={<Reclamacoes />} />
              <Route path="reclamacoes/:id" element={<ReclamacaoDetalhes />} />
              <Route path="unauthorized" element={<UnauthorizedPage />} />
              <Route path=":shortCode" element={<ShortUrlRedirect />} />
            </Route>
            
            <Route path="/empresa-dashboard" element={<MainLayout />}>
              <Route index element={<LocalDashboard />} />
            </Route>

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="locais" element={<AdminLocais />} />
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