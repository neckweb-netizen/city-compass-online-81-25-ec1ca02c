import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SolicitarPropriedadeAvisoProps {
  nomeEmpresa: string;
  empresaId: string;
  empresaUsuarioId?: string | null;
}

export const SolicitarPropriedadeAviso = ({ nomeEmpresa, empresaId, empresaUsuarioId }: SolicitarPropriedadeAvisoProps) => {
  // Verificar se existe um admin atribuído para esta empresa
  const { data: temAdminAtribuido, isLoading: loadingAdmin } = useQuery({
    queryKey: ['empresa-admin-check', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuario_empresa_admin')
        .select('id')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .limit(1);
      
      if (error) throw error;
      return data && data.length > 0;
    },
    enabled: !!empresaId
  });

  // Verificar se o proprietário da empresa é criador_empresa
  const { data: proprietarioEhCriador, isLoading: loadingProprietario } = useQuery({
    queryKey: ['empresa-proprietario-tipo', empresaUsuarioId],
    queryFn: async () => {
      if (!empresaUsuarioId) return false;
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('tipo_conta')
        .eq('id', empresaUsuarioId)
        .single();
      
      if (error) throw error;
      return data?.tipo_conta === 'criador_empresa' || data?.tipo_conta === 'empresa';
    },
    enabled: !!empresaUsuarioId
  });

  // Só mostrar o aviso se:
  // 1. Não tem proprietário OU proprietário é usuário comum (não criador_empresa/empresa)
  // 2. E não tem admin atribuído
  const temProprietarioValido = empresaUsuarioId && proprietarioEhCriador;
  const deveExibirAviso = !temProprietarioValido && !temAdminAtribuido;

  if (loadingAdmin || loadingProprietario || !deveExibirAviso) {
    return null;
  }
  const handleWhatsAppContact = () => {
    const whatsappNumber = "557598184008";
    const message = `Olá! Eu sou responsável pela empresa "${nomeEmpresa}" e gostaria de ter acesso como proprietário para gerenciar o perfil.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Card className="bg-blue-50 border-blue-200 mb-6">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 mb-1">
              Esta empresa é sua?
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Se você é o proprietário ou responsável por esta empresa, entre em contato conosco para ter acesso completo ao perfil e poder gerenciar informações, produtos e eventos.
            </p>
            <Button 
              onClick={handleWhatsAppContact}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Solicitar Acesso via WhatsApp
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};