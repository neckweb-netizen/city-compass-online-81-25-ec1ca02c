import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useMenuConfiguracoes } from '@/hooks/useMenuConfiguracoes';
import { useTutorial } from '@/hooks/useTutorial';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Watermark } from '@/components/ui/watermark';
import * as Icons from 'lucide-react';
interface DesktopSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}
export const DesktopSidebar = ({
  isOpen,
  onToggle
}: DesktopSidebarProps) => {
  const location = useLocation();
  const {
    user,
    profile
  } = useAuth();
  const {
    configuracoes,
    isLoading
  } = useMenuConfiguracoes();
  const {
    startTutorial
  } = useTutorial();

  // Todos os itens de menu disponíveis - incluindo todos os itens do sistema
  const allMenuItems = [
  // Itens principais
  {
    id: 'home',
    nome_item: 'Início',
    icone: 'Home',
    rota: '/',
    categoria: 'principal'
  }, {
    id: 'empresas',
    nome_item: 'Locais',
    icone: 'Building2',
    rota: '/locais',
    categoria: 'principal'
  }, {
    id: 'categorias',
    nome_item: 'Categorias',
    icone: 'Tags',
    rota: '/categorias',
    categoria: 'principal'
  }, {
    id: 'eventos',
    nome_item: 'Eventos',
    icone: 'Calendar',
    rota: '/eventos',
    categoria: 'principal'
  }, {
    id: 'oportunidades',
    nome_item: 'Oportunidades',
    icone: 'Briefcase',
    rota: '/oportunidades',
    categoria: 'principal'
  }, {
    id: 'radios',
    nome_item: 'Rádios',
    icone: 'Radio',
    rota: '/radios',
    categoria: 'principal'
  }, {
    id: 'canal',
    nome_item: 'Canal Informativo',
    icone: 'MessageCircle',
    rota: '/canal-informativo',
    categoria: 'principal'
  }, {
    id: 'voz-do-povo',
    nome_item: 'Voz do Povo',
    icone: 'Megaphone',
    rota: '/reclamacoes',
    categoria: 'principal'
  }, {
    id: 'buscar',
    nome_item: 'Buscar',
    icone: 'Search',
    rota: '/busca',
    categoria: 'principal'
  }, {
    id: 'ajuda',
    nome_item: 'Ajuda',
    icone: 'HelpCircle',
    rota: '/help',
    categoria: 'principal'
  },
  // Empresa (se aplicável)
  ...(profile?.tipo_conta === 'empresa' ? [{
    id: 'empresa-dashboard',
    nome_item: 'Dashboard Empresa',
    icone: 'BarChart3',
    rota: '/empresa-dashboard',
    categoria: 'empresa'
  }] : []),
  // Itens administrativos
  ...(profile?.tipo_conta === 'admin_geral' || profile?.tipo_conta === 'admin_cidade' ? [{
    id: 'admin',
    nome_item: 'Painel Admin',
    icone: 'Shield',
    rota: '/admin',
    categoria: 'admin'
  }] : [])];

  // Mesclar com configurações do banco se existirem
  const finalMenuItems = allMenuItems.map(item => {
    const dbConfig = configuracoes.find(config => config.rota === item.rota);
    if (dbConfig) {
      return {
        ...item,
        nome_item: dbConfig.nome_item,
        icone: dbConfig.icone,
        ativo: dbConfig.ativo,
        apenas_admin: dbConfig.apenas_admin
      };
    }
    return {
      ...item,
      ativo: true,
      apenas_admin: false
    };
  });

  // Filtrar apenas itens principais ativos
  const menuItems = finalMenuItems.filter(item => item.categoria === 'principal' && item.ativo !== false && (!item.apenas_admin || profile?.tipo_conta === 'admin_geral' || profile?.tipo_conta === 'admin_cidade'));

  // Adicionar itens específicos se aplicável
  if (profile?.tipo_conta === 'empresa') {
    const empresaItems = finalMenuItems.filter(item => item.categoria === 'empresa' && item.ativo !== false);
    menuItems.push(...empresaItems);
  }
  if (profile?.tipo_conta === 'admin_geral' || profile?.tipo_conta === 'admin_cidade') {
    const adminItems = finalMenuItems.filter(item => item.categoria === 'admin' && item.ativo !== false);
    menuItems.push(...adminItems);
  }
  const isActive = (rota: string) => {
    if (rota === '/') {
      return location.pathname === '/' && !location.search;
    }
    return location.pathname === rota || location.pathname.startsWith(rota + '/');
  };
  return <div className={cn("fixed left-0 top-0 h-full bg-background border-r transition-all duration-300 z-40 group", isOpen ? "w-64" : "w-16")} data-tutorial="sidebar">
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={cn(
          "absolute -right-3 top-6 z-50 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-muted transition-all duration-300",
          "opacity-0 group-hover:opacity-100"
        )}
      >
        <Icons.ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", !isOpen && "rotate-180")} />
      </Button>
      
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-center">
            <img src="/lovable-uploads/e4435ab0-198f-4ab7-b4d2-83024c9490fc.png" alt="Saj Tem Logo" className={cn("transition-all duration-300", isOpen ? "h-12 w-auto" : "h-8 w-8")} width={isOpen ? 48 : 32} height={isOpen ? 48 : 32} sizes={isOpen ? "48px" : "32px"} />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="py-2">
            {menuItems.map(item => {
            const IconComponent = Icons[item.icone as keyof typeof Icons] as React.ComponentType<{
              className?: string;
            }>;
            return <Link 
              key={item.id} 
              to={item.rota} 
               className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-all duration-100 text-left font-normal hover:scale-105 active:scale-95",
                  isActive(item.rota) 
                    ? "bg-primary text-primary-foreground" 
                    : "text-foreground hover:bg-muted hover:text-foreground"
                )}
            >
                  {IconComponent && <IconComponent className="h-5 w-5 flex-shrink-0" />}
                  {isOpen && <span className="text-sm font-medium truncate">
                      {item.nome_item}
                    </span>}
                </Link>;
          })}

            {/* Tutorial Button */}
            
          </div>
        </ScrollArea>

        {/* Watermark */}
        {isOpen && (
          <div className="p-4">
            <Watermark variant="sidebar" />
          </div>
        )}
      </div>
    </div>;
};