import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Calendar, User, CreditCard, Clock } from 'lucide-react';

interface AssignPlanoManualModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AssignPlanoManualModal = ({ open, onOpenChange, onSuccess }: AssignPlanoManualModalProps) => {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedPlano, setSelectedPlano] = useState<string>('');
  const [dias, setDias] = useState<string>('30');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Buscar usuários com empresas
  const { data: usuarios } = useQuery({
    queryKey: ['usuarios-empresas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select(`
          id,
          nome,
          usuario_id,
          usuarios!empresas_usuario_id_fkey(id, nome, email)
        `)
        .eq('ativo', true);

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Buscar planos disponíveis
  const { data: planos } = useQuery({
    queryKey: ['planos-ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .eq('ativo', true)
        .order('preco_mensal', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedPlano || !dias) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Calcular data de vencimento
      const hoje = new Date();
      const dataVencimento = new Date(hoje);
      dataVencimento.setDate(hoje.getDate() + parseInt(dias));

      // Atualizar empresa com novo plano
      const { error } = await supabase
        .from('empresas')
        .update({
          plano_atual_id: selectedPlano,
          plano_data_vencimento: dataVencimento.toISOString(),
        })
        .eq('id', selectedUser);

      if (error) throw error;

      toast({
        title: 'Plano atribuído com sucesso!',
        description: `Plano ativo por ${dias} dias`,
      });

      onSuccess?.();
      onOpenChange(false);
      setSelectedUser('');
      setSelectedPlano('');
      setDias('30');
    } catch (error) {
      console.error('Erro ao atribuir plano:', error);
      toast({
        title: 'Erro ao atribuir plano',
        description: 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatarPreco = (preco: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(preco);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Atribuir Plano Manualmente
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="usuario" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Local/Usuário
            </Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um local" />
              </SelectTrigger>
              <SelectContent>
                {usuarios?.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.nome} - {item.usuarios?.nome} ({item.usuarios?.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plano" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Plano
            </Label>
            <Select value={selectedPlano} onValueChange={setSelectedPlano}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {planos?.map((plano) => (
                  <SelectItem key={plano.id} value={plano.id}>
                    {plano.nome} - {formatarPreco(plano.preco_mensal)}/mês
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dias" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Duração (dias)
            </Label>
            <Input
              id="dias"
              type="number"
              min="1"
              max="365"
              value={dias}
              onChange={(e) => setDias(e.target.value)}
              placeholder="30"
            />
            <p className="text-sm text-muted-foreground">
              O plano ficará ativo por {dias} dias a partir de hoje
            </p>
          </div>

          {selectedPlano && planos && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Resumo da Atribuição:</h4>
              <div className="text-sm space-y-1">
                <p>• Plano: {planos.find(p => p.id === selectedPlano)?.nome}</p>
                <p>• Duração: {dias} dias</p>
                <p className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Expira em: {new Date(Date.now() + parseInt(dias) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Atribuindo...' : 'Atribuir Plano'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};