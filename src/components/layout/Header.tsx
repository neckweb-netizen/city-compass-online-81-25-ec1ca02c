import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, BellRing, Moon, Sun, Check, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { useTheme } from '@/components/ui/theme-provider';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MobileHamburger } from '@/components/layout/MobileHamburger';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export const Header = () => {
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogDefaultTab, setAuthDialogDefaultTab] = useState<'login' | 'register'>('login');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    notifications, 
    totalUnread, 
    loading: loadingNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  // Monitora a URL para abrir o Modal automaticamente na aba correta
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('auth') === 'signup' || searchParams.get('mode') === 'register') {
      setAuthDialogDefaultTab('register');
      setAuthDialogOpen(true);
    }
  }, [location.search]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      if (notification.action_url.startsWith('/')) navigate(notification.action_url);
      else window.location.assign(notification.action_url);
    }
  };

  const formatarTempo = (dataString: string) => {
    const agora = new Date();
    const data = new Date(dataString);
    const diffMs = agora.getTime() - data.getTime();
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutos < 1) return 'Agora';
    if (diffMinutos < 60) return `${diffMinutos} min atrás`;
    if (diffHoras < 24) return `${diffHoras}h atrás`;
    if (diffDias === 1) return 'Ontem';
    if (diffDias < 7) return `${diffDias} dias atrás`;
    return data.toLocaleDateString('pt-BR');
  };

  const isHomePage = location.pathname === '/';

  return (
    <div className="sticky top-0 z-40 w-full">
      <header className="bg-background/95 backdrop-blur-sm border-b border-border shadow-sm w-full">
        <div className="w-full max-w-full px-2 py-2 lg:px-6 lg:py-3">
          <div className="flex items-center justify-between w-full min-w-0 gap-1.5 sm:gap-2 lg:gap-4">
            {/* Logo and Mobile Menu */}
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 min-w-0 flex-shrink-0">
              <MobileHamburger />
              <div className="flex items-center gap-2 lg:gap-3 min-w-0">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
                  {/* Caminho atualizado apontando para o arquivo renomeado da pasta public */}
                  <img 
                    src="/icon-192.png"
                    alt="Saj Tem Logo" 
                    className="w-full h-full object-contain"
                    loading="eager"
                    decoding="async"
                    width="40"
                    height="40"
                    sizes="40px"
                    onError={(e) => {
                      // Fallback automático caso sofra com cache antigo do Service Worker
                      e.currentTarget.src = "/favicon.png";
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm lg:text-lg font-bold text-primary truncate">
                    Saj Tem
                  </h1>
                  <p className="text-xs text-muted-foreground hidden lg:block truncate">Santo Antônio de Jesus</p>
                </div>
              </div>
            </div>

            {/* Search Bar - only visible on non-homepage */}
            {!isHomePage && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Abrir busca"
                onClick={() => navigate('/busca')}
                className="ml-auto h-10 w-10 shrink-0 rounded-full lg:hidden"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {!isHomePage && (
              <div className="mx-4 hidden min-w-0 max-w-md flex-1 lg:block">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full min-w-0 pl-9 pr-2 sm:pl-10 sm:pr-4 py-2 text-sm border-0 focus:border-0 focus:ring-2 focus:ring-primary/20 rounded-full shadow-sm bg-muted/50"
                  />
                </form>
              </div>
            )}

            {/* Actions */}
            <div className={cn("flex items-center gap-0.5 sm:gap-1 lg:gap-2 flex-shrink-0", isHomePage && "ml-auto")}>
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="h-10 w-10 lg:h-12 lg:w-12 rounded-full p-0 hover:bg-accent flex-shrink-0"
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5 lg:h-6 lg:w-6 text-foreground" />
                ) : (
                  <Sun className="h-5 w-5 lg:h-6 lg:w-6 text-foreground" />
                )}
              </Button>
              
              {/* Notifications - Only for logged users */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="sm" className="h-10 w-10 lg:h-12 lg:w-12 rounded-full p-0 relative hover:bg-accent flex-shrink-0">
                       {totalUnread > 0 ? (
                         <>
                           <BellRing className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                           <Badge 
                             variant="destructive" 
                             className="absolute -top-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center p-0 text-xs animate-pulse"
                           >
                             {totalUnread > 99 ? '99+' : totalUnread}
                           </Badge>
                         </>
                       ) : (
                         <Bell className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                       )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 sm:w-80 shadow-2xl z-[9999] bg-popover border-border border max-h-96 overflow-y-auto">
                     <div className="p-3 font-semibold text-sm border-b bg-muted flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         Notificações
                         {totalUnread > 0 && (
                           <Badge variant="secondary">
                             {totalUnread}
                           </Badge>
                         )}
                       </div>
                       {totalUnread > 0 && (
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => markAllAsRead()}
                           className="h-6 px-2 text-xs"
                         >
                           <Check className="h-3 w-3 mr-1" />
                           Marcar todas
                         </Button>
                       )}
                     </div>
                    
                     {loadingNotifications ? (
                       <div className="p-4 text-center text-muted-foreground">
                         Carregando notificações...
                       </div>
                     ) : notifications.length > 0 ? (
                       notifications.slice(0, 8).map((notification) => (
                         <DropdownMenuItem 
                           key={notification.id} 
                            className={`flex flex-col items-start p-4 hover:bg-accent cursor-pointer ${
                              !notification.read ? 'bg-primary/5' : ''
                            }`}
                           onClick={() => handleNotificationClick(notification)}
                         >
                           <div className="flex items-start justify-between w-full">
                             <div className="flex-1">
                               <div className="font-medium text-sm text-foreground flex items-center gap-2">
                                 {notification.title}
                                 {!notification.read && (
                                   <div className="w-2 h-2 bg-primary rounded-full"></div>
                                 )}
                               </div>
                               {notification.message && (
                                 <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                   {notification.message}
                                 </div>
                               )}
                               <div className="text-xs text-muted-foreground mt-1">
                                 {formatarTempo(notification.created_at)}
                               </div>
                             </div>
                           </div>
                         </DropdownMenuItem>
                       ))
                     ) : (
                       <DropdownMenuItem className="p-4 text-muted-foreground text-center">
                         Nenhuma notificação
                       </DropdownMenuItem>
                     )}
                     <DropdownMenuSeparator />
                     <DropdownMenuItem
                       className="justify-center font-medium text-primary cursor-pointer"
                       onClick={() => navigate('/notificacoes')}
                     >
                       Ver todas as notificações
                     </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {/* User Menu or Login */}
              {user && profile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 px-1.5 lg:h-12 lg:px-3 rounded-full hover:bg-accent flex-shrink-0">
                      <Avatar className="h-8 w-8 lg:h-10 lg:w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm lg:text-base font-semibold">
                          {profile.nome?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="ml-2 text-sm font-medium hidden xl:block truncate max-w-32">
                        {profile.nome || 'Usuário'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 shadow-lg z-50 bg-background border">
                    <div className="p-3 border-b">
                      <p className="font-medium text-sm text-foreground">{profile.nome || 'Usuário'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {profile.tipo_conta === 'empresa' ? 'Empresa' : 
                         profile.tipo_conta === 'admin_cidade' ? 'Admin Cidade' :
                         profile.tipo_conta === 'admin_geral' ? 'Admin Geral' : 'Usuário'}
                      </Badge>
                    </div>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>Meu Perfil</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/configuracoes')}>Configurações</DropdownMenuItem>
                    {profile.tipo_conta === 'empresa' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/empresa-dashboard')}>Minha Empresa</DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={() => {
                    setAuthDialogDefaultTab('login');
                    setAuthDialogOpen(true);
                  }}
                  size="sm"
                  className="h-10 lg:h-12 rounded-full px-3 lg:px-5 bg-primary hover:bg-primary/90 shadow-md text-xs lg:text-sm flex-shrink-0"
                  data-tutorial="auth-button"
                  data-auth-trigger="true"
                >
                  Entrar
                </Button>
              )}
            </div>
          </div>
        </div>

        <AuthDialog 
          open={authDialogOpen} 
          onOpenChange={setAuthDialogOpen}
          defaultTab={authDialogDefaultTab}
        />
      </header>
    </div>
  );
};
