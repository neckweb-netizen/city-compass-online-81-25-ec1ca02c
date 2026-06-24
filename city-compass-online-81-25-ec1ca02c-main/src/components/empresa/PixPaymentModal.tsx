import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, CheckCircle, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plano: {
    id: string;
    nome: string;
    preco_mensal: number;
  };
}

export const PixPaymentModal = ({ isOpen, onClose, plano }: PixPaymentModalProps) => {
  const [documento, setDocumento] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<'CPF' | 'CNPJ'>('CPF');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
  };

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
      .slice(0, 18);
  };

  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = tipoDocumento === 'CPF' 
      ? formatCPF(e.target.value) 
      : formatCNPJ(e.target.value);
    setDocumento(formatted);
  };

  const handleTipoDocumentoChange = (value: 'CPF' | 'CNPJ') => {
    setTipoDocumento(value);
    setDocumento(''); // Limpa o campo ao mudar o tipo
  };

  const createPixPayment = async () => {
    if (!profile) {
      toast({
        title: 'Erro de autenticação',
        description: 'Faça login para continuar',
        variant: 'destructive',
      });
      return;
    }

    const documentoNumeros = documento.replace(/\D/g, '');
    const documentoValido = tipoDocumento === 'CPF' 
      ? documentoNumeros.length === 11 
      : documentoNumeros.length === 14;

    if (!documento || !documentoValido) {
      toast({
        title: `${tipoDocumento} inválido`,
        description: `Por favor, insira um ${tipoDocumento} válido`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          planoId: plano.id,
          userInfo: {
            nome: profile?.nome || 'Usuário',
            email: profile?.email || '',
            documento: documento.replace(/\D/g, ''),
            tipoDocumento,
          },
        },
      });

      if (error) {
        console.error('Erro ao criar pagamento:', error);
        toast({
          title: 'Erro ao criar pagamento',
          description: 'Tente novamente em alguns instantes',
          variant: 'destructive',
        });
        return;
      }

      setPaymentData(data);
      toast({
        title: 'Pagamento criado!',
        description: 'Escaneie o QR Code ou copie o código Pix',
      });
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Tente novamente em alguns instantes',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyPixCode = async () => {
    if (paymentData?.qr_code) {
      try {
        await navigator.clipboard.writeText(paymentData.qr_code);
        setCopied(true);
        toast({
          title: 'Código copiado!',
          description: 'Cole no seu app de pagamentos',
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Erro ao copiar:', error);
        toast({
          title: 'Erro ao copiar',
          description: 'Tente selecionar e copiar manualmente',
          variant: 'destructive',
        });
      }
    }
  };

  const handleClose = () => {
    setPaymentData(null);
    setDocumento('');
    setTipoDocumento('CPF');
    setCopied(false);
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Pagamento via Pix
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!paymentData ? (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold">{plano.nome}</h3>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(plano.preco_mensal)}/mês
                </p>
              </div>

              <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium">Dados do titular:</h4>
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input value={profile?.nome || ''} readOnly className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input value={profile?.email || ''} readOnly className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipoDocumento">Tipo de Documento *</Label>
                  <Select value={tipoDocumento} onValueChange={handleTipoDocumentoChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CPF">CPF (Pessoa Física)</SelectItem>
                      <SelectItem value="CNPJ">CNPJ (Pessoa Jurídica)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="documento">{tipoDocumento} *</Label>
                  <Input
                    id="documento"
                    placeholder={tipoDocumento === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                    value={documento}
                    onChange={handleDocumentoChange}
                    maxLength={tipoDocumento === 'CPF' ? 14 : 18}
                  />
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={createPixPayment}
                disabled={isLoading || !documento}
              >
                {isLoading ? 'Gerando Pix...' : 'Gerar Pix'}
              </Button>
            </>
          ) : (
            <div className="space-y-6 text-center">
              <div>
                <h3 className="font-semibold mb-2">Escaneie o QR Code</h3>
                {paymentData.qr_code_base64 && (
                  <div className="flex justify-center mb-4">
                    <img 
                      src={`data:image/png;base64,${paymentData.qr_code_base64}`}
                      alt="QR Code Pix"
                      className="w-48 h-48 object-contain border rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Ou copie o código Pix:</Label>
                <div className="flex gap-2">
                  <Input
                    value={paymentData.qr_code || ''}
                    readOnly
                    className="text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyPixCode}
                    className={copied ? 'text-green-600' : ''}
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Valor: <span className="font-semibold">{formatCurrency(paymentData.transaction_amount)}</span></p>
                <p className="mt-2">O pagamento será processado automaticamente após a confirmação.</p>
              </div>

              <Button variant="outline" onClick={handleClose} className="w-full">
                Fechar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};