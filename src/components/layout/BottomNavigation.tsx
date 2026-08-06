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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-lg md:hidden">
      <div className="grid grid-cols-5 h-16 items-center px-2">
        {navItems.map((item) => {
          const IconComponent = item.icone;
          const ativo = isActive(item.rota);

          if (item.isAction) {
            return (
              <div key={item.rota} className="flex justify-center -mt-4">
                <Button
                  onClick={() => navigate(item.rota)}
                  className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                >
                  <IconComponent className="w-6 h-6 stroke-[2.5]" />
                </Button>
              </div>
            );
          }

          return (
            <Link
              key={item.rota}
              to={item.rota}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors py-1",
                ativo ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <IconComponent className={cn("w-5 h-5", ativo && "scale-110")} />
              <span className="text-[10px] tracking-tight truncate max-w-[55px] text-center">{item.nome}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
