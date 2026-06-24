
import { Link, useLocation } from 'react-router-dom';
import { Home, Building2, MessageCircle, Radio, Briefcase, User, Plus, X, Tag, Package, Calendar, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useMinhaEmpresa } from '@/hooks/useMinhaEmpresa';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { EventoFormModal } from '@/components/forms/EventoFormModal';
import { CupomFormModal } from '@/components/forms/CupomFormModal';
import { ProdutoFormModal } from '@/components/forms/ProdutoFormModal';
import { VagaFormModal } from '@/components/forms/VagaFormModal';

export const BottomNavigation = () => {
  const location = useLocation();
  const { user, profile } = useAuth();
  const { empresa } = useMinhaEmpresa();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showEventoForm, setShowEventoForm] = useState(false);
  const [showCupomForm, setShowCupomForm] = useState(false);
  const [showProdutoForm, setShowProdutoForm] = useState(false);
  const [showVagaForm, setShowVagaForm] = useState(false);

  const leftMenuItems = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: Building2, label: 'Locais', path: '/locais' },
  ];

  const rightMenuItems = [
    { icon: Megaphone, label: 'Voz do Povo', path: '/reclamacoes' },
    { icon: Briefcase, label: 'Oportunidades', path: '/oportunidades' },
  ];


  const actionOptions = [
    {
      icon: Calendar,
      label: 'Evento',
      action: () => {
        setShowEventoForm(true);
        setIsMenuOpen(false);
      },
      allowedUserTypes: ['usuario', 'empresa', 'admin_cidade', 'admin_geral', 'criador_empresa']
    },
    {
      icon: Tag,
      label: 'Cupom',
      action: () => {
        setShowCupomForm(true);
        setIsMenuOpen(false);
      },
      allowedUserTypes: ['empresa', 'admin_cidade', 'admin_geral', 'criador_empresa']
    },
    {
      icon: Package,
      label: 'Produto',
      action: () => {
        setShowProdutoForm(true);
        setIsMenuOpen(false);
      },
      allowedUserTypes: ['empresa', 'admin_cidade', 'admin_geral', 'criador_empresa']
    },
    {
      icon: Briefcase,
      label: 'Vaga',
      action: () => {
        setShowVagaForm(true);
        setIsMenuOpen(false);
      },
      allowedUserTypes: ['empresa', 'admin_cidade', 'admin_geral', 'criador_empresa']
    }
  ];

  const availableActions = user && profile ? actionOptions.filter(option => 
    option.allowedUserTypes.includes(profile.tipo_conta)
  ) : [];

  const renderMenuItem = (item: typeof leftMenuItems[0]) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || 
                     (item.path !== '/' && location.pathname.startsWith(item.path));
    
    return (
      <Link
        key={item.path}
        to={item.path}
        className={cn(
          "flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all duration-100 min-w-0 bg-red-600",
          isActive 
            ? "text-primary-foreground transform scale-105" 
            : "text-primary-foreground/70 hover:text-primary-foreground hover:scale-105"
        )}
        // Preload on hover for instant navigation
        onMouseEnter={() => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = item.path;
          document.head.appendChild(link);
        }}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="text-xs font-medium truncate max-w-[60px]">
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <>
      <div 
        className="fixed bottom-0 left-0 right-0 bg-red-600 border-t border-red-600/30 z-50"
        data-tutorial="bottom-nav"
      >
        {/* Menu de ações flutuante */}
        {isMenuOpen && availableActions.length > 0 && (
          <>
            <div
              className="fixed inset-0 bg-black/20 z-[-1]"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 flex flex-col gap-2">
              {availableActions.map((action, index) => {
                const ActionIcon = action.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 justify-center"
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      animation: 'fadeInUp 0.3s ease-out forwards'
                    }}
                  >
                     <div className="bg-popover text-popover-foreground px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg">
                       {action.label}
                     </div>
                     <Button
                       size="icon"
                       className="w-12 h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg transition-all duration-200 hover:scale-110"
                       onClick={action.action}
                     >
                      <ActionIcon className="h-5 w-5 text-primary-foreground" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <nav className="flex items-center justify-between px-4 py-2 relative">
          {/* Itens da esquerda */}
          <div className="flex items-center justify-around flex-1">
            {leftMenuItems.map(renderMenuItem)}
          </div>

          {/* Botão central de ação */}
          {user && availableActions.length > 0 && (
            <div className="px-4">
              <Button
                size="icon"
                className={cn(
                  "w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-600/80 shadow-lg transition-all duration-200 hover:scale-105",
                  isMenuOpen && "rotate-45 bg-destructive hover:bg-destructive/80"
                )}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Plus className="h-6 w-6" />
                )}
              </Button>
            </div>
          )}

          {/* Itens da direita */}
          <div className="flex items-center justify-around flex-1">
            {rightMenuItems.map(renderMenuItem)}
          </div>
        </nav>
      </div>

      {/* Modais dos formulários */}
      {empresa && (
        <EventoFormModal 
          open={showEventoForm}
          onOpenChange={setShowEventoForm}
          empresaId={empresa.id}
        />
      )}

      <CupomFormModal 
        open={showCupomForm}
        onOpenChange={setShowCupomForm}
      />

      <ProdutoFormModal 
        open={showProdutoForm}
        onOpenChange={setShowProdutoForm}
      />

      <VagaFormModal 
        open={showVagaForm}
        onOpenChange={setShowVagaForm}
      />

      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </>
  );
};
