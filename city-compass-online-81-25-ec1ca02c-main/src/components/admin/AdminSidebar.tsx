
import { Link, useLocation } from 'react-router-dom';
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
  MessagesSquare
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

  const menuSections = [
    {
      label: 'Principal',
      items: [
        { icon: Home, label: 'Dashboard', path: '/admin', section: 'dashboard' },
        { icon: BarChart3, label: 'Estatísticas', path: '/admin/estatisticas', section: 'estatisticas' },
      ]
    },
    {
      label: 'Gestão',
      items: [
        { icon: Building2, label: 'Locais', path: '/admin/locais', section: 'empresas' },
        { icon: UserCheck, label: 'Locais Pendentes', path: '/admin/locais-pendentes', section: 'empresas-pendentes' },
        { icon: Calendar, label: 'Eventos', path: '/admin/eventos', section: 'eventos' },
        { icon: Users, label: 'Usuários', path: '/admin/usuarios', section: 'usuarios' },
        { icon: Tag, label: 'Categorias', path: '/admin/categorias', section: 'categorias' },
        { icon: MapPin, label: 'Cidades', path: '/admin/cidades', section: 'cidades' },
        { icon: MapPin, label: 'Lugares Públicos', path: '/admin/lugares-publicos', section: 'lugares-publicos' },
      ]
    },
    {
      label: 'Oportunidades',
      items: [
        { icon: Briefcase, label: 'Vagas de Emprego', path: '/admin/vagas', section: 'vagas' },
        { icon: Wrench, label: 'Serviços Autônomos', path: '/admin/servicos', section: 'servicos' },
      ]
    },
    {
      label: 'Conteúdo',
      items: [
        { icon: MessageCircle, label: 'Canal Informativo', path: '/admin/canal-informativo', section: 'canal-informativo' },
        { icon: Megaphone, label: 'Voz do Povo', path: '/admin/reclamacoes', section: 'reclamacoes' },
        { icon: MessagesSquare, label: 'Comentários', path: '/admin/comentarios-problema', section: 'comentarios-problema' },
        { icon: Image, label: 'Banners', path: '/admin/banners', section: 'banners' },
        { icon: BookOpen, label: 'Stories', path: '/admin/stories', section: 'stories' },
        { icon: Vote, label: 'Enquetes', path: '/admin/enquetes', section: 'enquetes' },
        { icon: Bell, label: 'Avisos do Sistema', path: '/admin/avisos', section: 'avisos' },
        { icon: CreditCard, label: 'Cupons', path: '/admin/cupons', section: 'cupons' },
        { icon: Star, label: 'Avaliações', path: '/admin/avaliacoes', section: 'avaliacoes' },
      ]
    },
    {
      label: 'Sistema',
      items: [
        { icon: CreditCard, label: 'Planos', path: '/admin/planos', section: 'planos' },
        { icon: UserCog, label: 'Admins de Local', path: '/admin/local-admins', section: 'local-admins' },
        { icon: MenuIcon, label: 'Configurações de Menu', path: '/admin/menu', section: 'menu' },
        { icon: Home, label: 'Ordem das Seções', path: '/admin/home-sections', section: 'home-sections' },
        { icon: Settings, label: 'Configurações', path: '/admin/configuracoes', section: 'configuracoes' },
        { icon: Shield, label: 'Segurança', path: '/admin/security', section: 'security' },
        { icon: FileText, label: 'Logs', path: '/admin/logs', section: 'logs' },
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
                      >
                        <Link to={item.path}>
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
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
