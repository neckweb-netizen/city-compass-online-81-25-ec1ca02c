import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MessageCircle, Lock, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { useState } from 'react';

interface ServicoContactInfoProps {
  servico: {
    id: string;
    nome_prestador: string;
    email_prestador?: string;
    telefone_prestador?: string | null;
    whatsapp_prestador?: string | null;
    usuario_id?: string | null;
  };
  onContact?: (servicoId: string) => void;
}

export const ServicoContactInfo: React.FC<ServicoContactInfoProps> = ({ 
  servico, 
  onContact 
}) => {
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  
  // Check if current user owns this service
  const isOwner = user?.id === servico.usuario_id;
  
  const handleContactClick = (tipo: 'whatsapp' | 'telefone' | 'email') => {
    // If user is not authenticated, show login dialog
    if (!user) {
      setShowAuthDialog(true);
      return;
    }

    // Only allow contact if user is authenticated
    switch (tipo) {
      case 'whatsapp':
        if (servico.whatsapp_prestador) {
          window.open(`https://wa.me/55${servico.whatsapp_prestador.replace(/\D/g, '')}`, '_blank');
        }
        break;
      case 'telefone':
        if (servico.telefone_prestador) {
          window.open(`tel:${servico.telefone_prestador}`, '_blank');
        }
        break;
      case 'email':
        if (servico.email_prestador) {
          window.open(`mailto:${servico.email_prestador}`, '_blank');
        }
        break;
    }
    
    // Track contact attempt
    if (onContact) {
      onContact(servico.id);
    }
  };

  const ContactButton: React.FC<{
    type: 'whatsapp' | 'telefone' | 'email';
    available: boolean;
    icon: React.ReactNode;
    label: string;
    className?: string;
  }> = ({ type, available, icon, label, className }) => {
    if (!available) return null;

    return (
      <Button 
        size="lg"
        onClick={() => handleContactClick(type)}
        className={className}
        disabled={!user && !isOwner}
      >
        {!user ? <Lock className="w-4 h-4 mr-2" /> : icon}
        {!user ? 'Fazer Login' : label}
      </Button>
    );
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <span className="font-semibold text-lg">{servico.nome_prestador}</span>
          {!user && (
            <Badge variant="secondary" className="ml-2">
              <Lock className="w-3 h-3 mr-1" />
              Login necessário
            </Badge>
          )}
        </div>

        {!user && (
          <div className="p-4 bg-muted/50 rounded-lg border border-muted">
            <p className="text-sm text-muted-foreground text-center">
              Faça login para visualizar informações de contato e entrar em contato com o prestador
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <ContactButton
            type="whatsapp"
            available={!!servico.whatsapp_prestador}
            icon={<MessageCircle className="w-5 h-5 mr-2" />}
            label="WhatsApp"
            className="bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-300"
          />
          
          <ContactButton
            type="telefone"
            available={!!servico.telefone_prestador}
            icon={<Phone className="w-5 h-5 mr-2" />}
            label="Telefone"
            className="variant-outline shadow-lg hover:shadow-xl transition-all duration-300"
          />
          
          <ContactButton
            type="email"
            available={!!servico.email_prestador}
            icon={<Mail className="w-5 h-5 mr-2" />}
            label="E-mail"
            className="variant-outline shadow-lg hover:shadow-xl transition-all duration-300"
          />
        </div>
      </div>

      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog}
      />
    </>
  );
};