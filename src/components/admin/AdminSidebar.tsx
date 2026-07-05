import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Home, 
  Building2, 
  Calendar, 
  Users, 
  MapPin, 
  CreditCard, 
  Tag, 
  Image, 
  Star, 
  BarChart3, 
  Settings, 
  Menu as MenuIcon, 
  MessageCircle, 
  Bell, 
  BookOpen, 
  UserCog,
  Shield,
  FileText,
  Briefcase,
  Wrench,
  UserCheck,
  Download,
  Vote,
  Megaphone,
  MessagesSquare,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter
} from '@/components/ui/sidebar';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const AdminSidebar = ({ activeSection, onSectionChange }: AdminSidebarProps) => {
  const location = useLocation();
  
  // Estados para armazenar os números de notificações pendentes
  const [pendentesLocais, setPendentesLocais] = useState(0);
  const [pendentesVozDoPovo, setPendentesVozDoPovo] = useState(0);
  const [pendentesAchadosPerdidos, setPendentesAchadosPerdidos] = useState(0);

  // Busca as contagens de itens pendentes direto no Supabase
  const buscarContagensPendentes = async () => {
    try {
      // 1. Contagem de Locais Pendentes
      const { count: countLocais, error: errorLocais } = await supabase
        .from('empresas' as any)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');
      if (!errorLocais && countLocais !== null) setPendentesLocais(countLocais);

      // 2. Contagem de Voz do Povo (Reclamações Pendentes)
      const { count: countVoz, error: errorVoz } = await supabase
        .from('problemas_cidade' as any)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');
      if (!errorVoz && countVoz !== null) setPendentesVozDoPovo(countVoz);

      // 3. Contagem de Achados e Perdidos Pendentes
      const { count: countAchados, error: errorAchados } = await supabase
        .from('achados_perdidos' as any)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');
      if (!errorAchados && countAchados !== null) setPendentesAchadosPerdidos(countAchados);

    } catch (error) {
      console.error('Erro ao buscar contadores de notificações do admin:', error);
    }
  };

  useEffect(() => {
    buscarContagensPendentes();

    // Cria canais de tempo real para atualizar as notificações na hora que algo mudar no banco
    const canalLocais = supabase
      .channel('rt-admin-locais')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'empresas' }, () => buscarContagensPendentes())
      .subscribe();

    const canalVoz = supabase
      .channel('rt-admin-voz')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'problemas_cidade' }, () => buscarContagensPendentes())
      .subscribe();

    const canalAchados = supabase
      .channel('rt-admin-achados')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'achados_perdidos' }, () => buscarContagensPendentes())
      .subscribe();

    return () => {
      supabase.removeChannel(canalLocais);
      supabase.removeChannel(canalVoz);
      supabase.removeChannel(canalAchados);
    };
  }, []);

  const menuSections = [
    {
      label: 'Principal',
      items: [
        { icon: Home, label: 'Dashboard', path: '/admin', section: 'dashboard', badge: 0 },
        { icon: BarChart3, label: 'Estatísticas', path: '/admin/estatisticas', section: 'estatisticas', badge: 0 },
      ]
    },
    {
      label: 'Gestão',
      items: [
        { icon: Building2, label: 'Locais', path: '/admin/locais', section: 'empresas', badge: 0 },
        { icon: UserCheck, label: 'Locais Pendentes', path: '/admin/locais-pendentes', section: 'empresas-pendentes', badge: pendentesLocais },
        { icon: Download, label: 'Importar Google', path: '/admin/importar-google', section: 'importar-google', badge: 0 },
        { icon: Calendar, label: 'Eventos', path: '/admin/eventos', section: 'eventos', badge: 0 },
        { icon: Users, label: 'Usuários', path: '/admin/usuarios', section: 'usuarios', badge: 0 },
        { icon: Tag, label: 'Categorias', path: '/admin/categorias', section: 'categorias', badge: 0 },
        { icon: MapPin, label: 'Cidades', path: '/admin/cidades', section: 'cidades', badge: 0 },
        { icon: MapPin, label: 'Lugares Públicos', path: '/admin/lugares-publicos', section: 'lugares-publicos', badge: 0 },
      ]
    },
    {
      label: 'Oportunidades',
      items: [
        { icon: Briefcase, label: 'Vagas de Emprego', path: '/admin/vagas', section: 'vagas', badge: 0 },
        { icon: Wrench, label: 'Serviços Autônomos', path: '/admin/servicos', section: 'servicos', badge: 0 },
      ]
    },
    {
      label: 'Conteúdo',
      items: [
        { icon: MessageCircle, label: 'Canal Informativo', path: '/admin/canal-informativo', section: 'canal-informativo', badge: 0 },
        { icon: Megaphone, label: 'Voz do Povo', path: '/admin/reclamacoes', section: 'reclamacoes', badge: !!pendentesVozDoPovo ? pendentesVozDoPovo : 0 },
        { icon: MessagesSquare, label: 'Comentários', path: '/admin/comentarios-problema', section: 'comentarios-problema', badge: 0 },
        { icon: Search, label: 'Achados e Perdidos', path: '/admin/achados-e-perdidos', section: 'achados-e-perdidos', badge: !!pendentesAchadosPerdidos ? pendentesAchadosPerdidos : 0 },
        { icon: Image, label: 'Banners', path: '/admin/banners', section: 'banners', badge: 0 },
        { icon: BookOpen, label: 'Stories', path: '/admin/stories', section: 'stories', badge: 0 },
        { icon: Vote, label: 'Enquetes', path: '/admin/enquetes', section: 'enquetes', badge: 0 },
        { icon: Bell, label: 'Avisos do Sistema', path: '/admin/avisos', section: 'avisos', badge: 0 },
        { icon: CreditCard, label: 'Cupons', path: '/admin/cupons', section: 'cupons', badge: 0 },
        { icon: Star, label: 'Avaliações', path: '/admin/avaliacoes', section: 'avaliacoes', badge: 0 },
      ]
    },
    {
      label: 'Sistema',
      items: [
        { icon: CreditCard, label: 'Planos', path: '/admin/planos', section: 'planos', badge: 0 },
        { icon: UserCog, label: 'Admins de Local', path: '/admin/local-admins', section: 'local-admins', badge: 0 },
        { icon: MenuIcon, label: 'Configurações de Menu', path: '/admin/menu', section: 'menu', badge: 0 },
        { icon: Home, label: 'Ordem das Seções', path: '/admin/home-sections', section: 'home-sections', badge: 0 },
        { icon: Settings, label: 'Configurações', path: '/admin/configuracoes', section: 'configuracoes', badge: 0 },
        { icon: Shield, label: 'Segurança', path: '/admin/security', section: 'security', badge: 0 },
        { icon: FileText, label: 'Logs', path: '/admin/logs', section: 'logs', badge: 0 },
      ]
    }
  ];

  const handleNavigation = (section: string) => {
    console.log('🔄 Navigating to section:', section);
    onSectionChange(section);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <h2 className="text-lg font-semibold text-foreground">Admin Panel</h2>
      </SidebarHeader>
      
      <SidebarContent>
        {menuSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || activeSection === item.section;
                  
                  return (
                    <SidebarMenuItem key={item.section}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                        onClick={() => handleNavigation(item.section)}
                        className="w-full"
                      >
                        <Link to={item.path} className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </div>
                          
                          {/* Balãozinho vermelho com número de notificações, renderizado apenas se for maior que zero */}
                          {item.badge > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-black text-white shadow-sm animate-pulse">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t">
        <div className="text-sm text-foreground/70">
          Sistema de Gestão
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
