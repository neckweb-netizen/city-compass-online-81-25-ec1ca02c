import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, MessageCircle, Plus, Wrench, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { nome: 'Início', rota: '/', icone: Home },
    { nome: 'Canal', rota: '/canal-informativo', icone: MessageCircle },
    { nome: 'Criar', rota: '/cadastro-local', icone: Plus, isAction: true },
    { nome: 'Ferramentas', rota: '/ferramentas', icone: Wrench },
    { nome: 'Voz do Povo', rota: '/reclamacoes', icone: Megaphone },
  ];

  const isActive = (rota: string) => {
    if (rota === '/') {
      return location.pathname === '/' && !location.search;
    }
    return location.pathname === rota || location.pathname.startsWith(rota + '/');
  };

  return (
    <nav aria-label="Navegação principal" className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-full border-t border-primary/15 bg-background/95 shadow-[0_-8px_30px_-18px_hsl(var(--primary)/0.4)] backdrop-blur-xl lg:hidden pb-[env(safe-area-inset-bottom)]" data-tour="bottom-navigation">
      <div className="grid grid-cols-5 h-[4.5rem] w-full items-center px-1 sm:px-2">
        {navItems.map((item) => {
          const IconComponent = item.icone;
          const ativo = isActive(item.rota);

          if (item.isAction) {
            return (
              <div key={item.rota} className="relative -mt-5 flex items-center justify-center">
                <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-[5px] border-background bg-background shadow-[0_-3px_18px_-8px_hsl(var(--primary)/0.35)]">
                <Button
                  onClick={() => navigate(item.rota)}
                  aria-label="Criar publicação"
                  data-tour="create-action"
                  data-account-tour="publish"
                  className="flex h-[3.875rem] w-[3.875rem] shrink-0 items-center justify-center rounded-full border border-primary-foreground/25 bg-primary text-primary-foreground shadow-[0_5px_17px_-4px_hsl(var(--primary)/0.65)] ring-1 ring-primary/15 transition-[transform,box-shadow,background-color] hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_7px_22px_-4px_hsl(var(--primary)/0.7)] active:translate-y-0 motion-reduce:transform-none"
                >
                  <IconComponent className="!h-6 !w-6 stroke-[2.2]" />
                </Button>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.rota}
              to={item.rota}
              aria-current={ativo ? 'page' : undefined}
              data-tour={item.rota === '/ferramentas' ? 'tools-nav' : undefined}
              data-account-tour={item.rota === '/canal-informativo' ? 'channel' : item.rota === '/reclamacoes' ? 'community-voice' : undefined}
              className={cn(
                "group min-w-0 flex flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none",
                ativo ? "text-primary font-bold" : "text-muted-foreground hover:text-primary"
              )}
            >
              <span className={cn("flex h-9 w-11 items-center justify-center rounded-xl transition-colors", ativo ? "bg-primary/15 ring-1 ring-primary/15" : "group-hover:bg-primary/10")}>
                <IconComponent aria-hidden="true" className={cn("h-[21px] w-[21px] stroke-[1.9]", ativo && "stroke-[2.3]")} />
              </span>
              <span className="w-full truncate px-0.5 text-center text-[10px] font-medium tracking-tight">{item.nome}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
