import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { UserCheck, MessageSquare, Phone, User, Info } from 'lucide-react';

interface SolicitarResponsabilidadeDialogProps {
  empresaId: string;
  empresaNome: string;
}

export const SolicitarResponsabilidadeDialog = ({ 
  empresaId, 
  empresaNome 
}: SolicitarResponsabilidadeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    whatsapp: '',
    email: '',
    observacoes: ''
  });
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verificar se o usuário está logado
      if (!user) {
        toast.error('Você precisa estar logado para solicitar responsabilidade pela empresa.');
        setOpen(false);
        return;
      }

      // Criar uma notificação para os admins
      const { error } = await supabase
        .from('notificacoes')
        .insert({
          titulo: `Solicitação de Responsabilidade - ${empresaNome}`,
          conteudo: `
            O usuário ${formData.nome} (${user.email}) solicitou responsabilidade pela empresa "${empresaNome}".
            
            Dados do solicitante:
            - Nome: ${formData.nome}
            - Telefone: ${formData.telefone}
            - WhatsApp: ${formData.whatsapp}
            - Email: ${formData.email}
            
            Observações: ${formData.observacoes || 'Nenhuma observação adicional'}
          `,
          tipo: 'solicitacao_responsabilidade',
          referencia_tipo: 'empresa',
          referencia_id: empresaId,
          usuario_id: user.id
        });

      if (error) throw error;

      toast.success('Solicitação enviada com sucesso! Os administradores irão analisar sua solicitação.');
      setFormData({
        nome: '',
        telefone: '',
        whatsapp: '',
        email: '',
        observacoes: ''
      });
      setOpen(false);
    } catch (error: any) {
      console.error('Erro ao enviar solicitação:', error);
      toast.error('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <UserCheck className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Você representa esta empresa?
                </h4>
                <p className="text-xs text-blue-700 mb-2">
                  Solicite para se tornar responsável pelo perfil e gerenciar as informações.
                </p>
                <Button size="sm" variant="outline" className="h-7 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-100">
                  Solicitar Responsabilidade
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            Solicitar Responsabilidade
          </DialogTitle>
        </DialogHeader>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Ao solicitar responsabilidade por <strong>{empresaNome}</strong>, você poderá gerenciar informações, 
            responder avaliações e adicionar conteúdo ao perfil.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Seu nome completo"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  placeholder="(75) 99999-9999"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                placeholder="(75) 99999-9999"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email de Contato</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Descreva sua relação com a empresa (ex: sou proprietário, gerente, etc.)"
                className="pl-10 min-h-[80px] resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.nome || !formData.telefone}
              className="flex-1"
            >
              {loading ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};