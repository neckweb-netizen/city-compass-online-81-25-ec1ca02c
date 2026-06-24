
import React, { useState } from 'react';
import { Plus, Calendar, Tag, Package, X, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useMinhaEmpresa } from '@/hooks/useMinhaEmpresa';
import { EventoFormModal } from '@/components/forms/EventoFormModal';
import { CupomFormModal } from '@/components/forms/CupomFormModal';
import { ProdutoFormModal } from '@/components/forms/ProdutoFormModal';
import { VagaFormModal } from '@/components/forms/VagaFormModal';

interface FloatingActionOption {
  icon: React.ElementType;
  label: string;
  title: string;
  action: () => void;
  requiresAuth?: boolean;
  allowedUserTypes?: ('usuario' | 'empresa' | 'admin_cidade' | 'admin_geral' | 'criador_empresa')[];
}

export const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showEventoForm, setShowEventoForm] = useState(false);
  const [showCupomForm, setShowCupomForm] = useState(false);
  const [showProdutoForm, setShowProdutoForm] = useState(false);
  const [showVagaForm, setShowVagaForm] = useState(false);
  const { user, profile } = useAuth();
  const { empresa } = useMinhaEmpresa();

  // Se não há usuário logado, não mostra o FAB
  if (!user || !profile) {
    return null;
  }

  const options: FloatingActionOption[] = [
    {
      icon: Calendar,
      label: 'Criar Evento',
      title: 'Novo Evento',
      action: () => {
        setShowEventoForm(true);
        setIsOpen(false);
      },
      requiresAuth: true,
      allowedUserTypes: ['usuario', 'empresa', 'admin_cidade', 'admin_geral', 'criador_empresa']
    },
    {
      icon: Tag,
      label: 'Criar Cupom',
      title: 'Novo Cupom',
      action: () => {
        setShowCupomForm(true);
        setIsOpen(false);
      },
      requiresAuth: true,
      allowedUserTypes: ['empresa', 'admin_cidade', 'admin_geral', 'criador_empresa']
    },
    {
      icon: Package,
      label: 'Criar Produto',
      title: 'Novo Produto',
      action: () => {
        setShowProdutoForm(true);
        setIsOpen(false);
      },
      requiresAuth: true,
      allowedUserTypes: ['empresa', 'admin_cidade', 'admin_geral', 'criador_empresa']
    },
    {
      icon: Briefcase,
      label: 'Criar Vaga',
      title: 'Nova Vaga',
      action: () => {
        setShowVagaForm(true);
        setIsOpen(false);
      },
      requiresAuth: true,
      allowedUserTypes: ['empresa', 'admin_cidade', 'admin_geral', 'criador_empresa']
    }
  ];

  // Filtrar opções baseadas no tipo de usuário
  const availableOptions = options.filter(option => {
    if (option.requiresAuth && !user) return false;
    if (option.allowedUserTypes && !option.allowedUserTypes.includes(profile.tipo_conta)) return false;
    return true;
  });

  // Se não há opções disponíveis, não mostra o FAB
  if (availableOptions.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-20 right-2 z-40 lg:bottom-8 lg:right-4">
        {/* Backdrop para fechar o menu */}
        {isOpen && (
          <div
            className="fixed inset-0 z-[-1] bg-black/20"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Opções do menu */}
        <div className={cn(
          "flex flex-col-reverse gap-3 mb-3 transition-all duration-300 ease-in-out",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}>
          {availableOptions.map((option, index) => {
            const IconComponent = option.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-3 justify-end"
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animation: isOpen ? 'fadeInUp 0.3s ease-out forwards' : 'none'
                }}
              >
                {/* Label com título */}
                <div className="bg-gray-900/90 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg">
                  <div className="font-semibold">{option.title}</div>
                  <div className="text-xs opacity-80">{option.label}</div>
                </div>
                
                {/* Botão da opção */}
                <Button
                  size="icon"
                  className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg transition-all duration-200 hover:scale-110 flex-shrink-0"
                  onClick={option.action}
                  title={option.title}
                >
                  <IconComponent className="h-5 w-5" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Botão principal */}
        <Button
          size="icon"
          className={cn(
            "w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl transition-all duration-200 hover:scale-105 flex-shrink-0",
            isOpen && "rotate-45 bg-red-600 hover:bg-red-700"
          )}
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? "Fechar menu" : "Menu de ações"}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>
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
