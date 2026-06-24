import React from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMenuConfiguracoes } from '@/hooks/useMenuConfiguracoes';
import { useTutorial } from '@/hooks/useTutorial';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Watermark } from '@/components/ui/watermark';
export const MobileHamburger = () => {
  const navigate = useNavigate();
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
  const [open, setOpen] = React.useState(false);
  const [navigatingTo, setNavigatingTo] = React.useState<string | null>(null);

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
  const handleNavigation = (rota: string) => {
    // Feedback visual imediato
    setNavigatingTo(rota);
    
    // Fechar o menu IMEDIATAMENTE ao clicar
    setOpen(false);
    
    // Navegar com pequeno delay apenas para suavizar a transição
    setTimeout(() => {
      navigate(rota);
      setNavigatingTo(null);
    }, 150);
  };
  const isActive = (rota: string) => {
    if (rota === '/') {
      return location.pathname === '/' && !location.search;
    }
    return location.pathname === rota || location.pathname.startsWith(rota + '/');
  };
  return <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="lg:hidden text-foreground hover:text-foreground">
          <Menu className="h-5 w-5 text-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 bg-background">
        <div className="h-full flex flex-col">
          {/* Logo Section */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-center">
              <img src="/lovable-uploads/e4435ab0-198f-4ab7-b4d2-83024c9490fc.png" alt="Saj Tem Logo" className="h-12 w-auto" width="48" height="48" sizes="48px" />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="py-2">
              {menuItems.map(item => {
              const IconComponent = Icons[item.icone as keyof typeof Icons] as React.ComponentType<{
                className?: string;
              }>;
              return <Button 
                key={item.id} 
                variant="ghost" 
                className={cn(
                  "w-full justify-start gap-3 h-12 px-4 rounded-none text-left font-normal transition-all duration-100 transform",
                  navigatingTo === item.rota 
                    ? "bg-primary text-primary-foreground scale-95" // Feedback visual imediato
                    : isActive(item.rota) 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "text-foreground hover:bg-muted hover:text-foreground active:scale-95"
                )}
                onClick={() => handleNavigation(item.rota)}
                disabled={navigatingTo === item.rota}
              >
                    {IconComponent && <IconComponent className="h-5 w-5 flex-shrink-0" />}
                    <span>{item.nome_item}</span>
                    {navigatingTo === item.rota && (
                      <div className="ml-auto">
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      </div>
                    )}
                  </Button>;
            })}

              {/* Tutorial Button */}
              
            </div>
          </ScrollArea>
          
          {/* Watermark */}
          <div className="p-4">
            <Watermark variant="sidebar" />
          </div>
        </div>
      </SheetContent>
    </Sheet>;
};