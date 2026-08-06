import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Building2, Search, Wrench, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BottomNavigation = () => {
  const location = useLocation();

  const navItems = [
    { nome: 'Início', rota: '/', icone: Home },
    { nome: 'Locais', rota: '/locais', icone: Building2 },
    { nome: 'Ferramentas', rota: '/ferramentas', icone: Wrench },
    { nome: 'Buscar', rota: '/busca', icone: Search },
  ];

  const isActive = (rota: string) => {
    if (rota === '/') {
      return location.pathname === '/' && !location.search;
    }
    return location.pathname === rota || location.pathname.startsWith(rota + '/');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg md:hidden">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const IconComponent = item.icone;
          const ativo = isActive(item.rota);
          return (
            <Link
              key={item.rota}
              to={item.rota}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                ativo ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <IconComponent className={cn("w-5 h-5", ativo && "scale-110")} />
              <span className="text-[10px] tracking-tight">{item.nome}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// Exportação padrão de segurança caso algum arquivo importe via default
export default BottomNavigation;
