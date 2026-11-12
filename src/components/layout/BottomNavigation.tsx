import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, MessageCircle, Plus, Wrench, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Mantenha os destinos e a ordem da navegação existente.
  const navItems = [
    { nome: 'Início', rota: '/', icone: Home },
    { nome: 'Canal', rota: '/canal-informativo', icone: MessageCircle },
    { nome: 'Criar', rota: '/cadastro-local', icone: Plus, isAction: true },
    { nome: 'Ferramentas', rota: '/ferramentas', icone: Wrench },
    { nome: 'Voz do Povo', rota: '/reclamacoes', icone: Megaphone },
  ];

  const isActive = (rota: string) =>
    rota === '/'
      ? location.pathname === '/' && !location.search
      : location.pathname === rota || location.pathname.startsWith(rota + '/');

  return (
    <nav
      aria-label="Navegação principal"
      data-tour="bottom-navigation"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.625rem)] left-3 right-3 z-50 mx-auto max-w-lg rounded-[1.75rem] border border-primary/15 bg-background/95 shadow-[0_12px_40px_-14px_hsl(var(--primary)/0.35)] backdrop-blur-xl lg:hidden"
    >
      <div className="grid h-[4.125rem] grid-cols-5 items-center px-1.5">
        {navItems.map((item) => {
          const IconComponent = item.icone;
          const ativo = isActive(item.rota);

          if (item.isAction) {
            return (
              <div key={item.rota} className="relative flex justify-center">
                <div className="absolute -top-[2.375rem] flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-[6px] border-background bg-background">
                  <Button
                    type="button"
                    onClick={() => navigate(item.rota)}
                    aria-label="Criar publicação"
                    data-tour="create-action"
                    data-account-tour="publish"
                    className="h-[3.75rem] w-[3.75rem] rounded-full border border-primary-foreground/20 bg-primary p-0 text-primary-foreground shadow-[0_8px_20px_-6px_hsl(var(--primary)/0.65)] ring-1 ring-primary/15 transition-[transform,box-shadow] motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none"
                  >
                    <IconComponent aria-hidden="true" className="!h-6 !w-6 stroke-[2.2]" />
                  </Button>
                </div>
                <span className="mt-9 text-[10px] font-semibold text-primary">Criar</span>
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
                'group flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none',
                ativo ? 'font-bold text-primary' : 'text-muted-foreground hover:text-primary'
              )}
            >
              <span className={cn(
                'flex h-9 w-11 items-center justify-center rounded-2xl transition-colors',
                ativo ? 'bg-primary/10 ring-1 ring-primary/15' : 'group-hover:bg-primary/10'
              )}>
                <IconComponent aria-hidden="true" className={cn('h-[21px] w-[21px] stroke-[1.9]', ativo && 'stroke-[2.3]')} />
              </span>
              <span className="w-full truncate px-0.5 text-center text-[9px] font-medium tracking-tight min-[370px]:text-[10px]">{item.nome}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
