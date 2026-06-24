import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useEnderecosEmpresa } from '@/hooks/useEnderecosEmpresa';
import { useCidades } from '@/hooks/useCidades';


interface EnderecoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresaId: string;
  endereco?: any;
}

export const EnderecoFormModal = ({ isOpen, onClose, empresaId, endereco }: EnderecoFormModalProps) => {
  const { createEndereco, updateEndereco, isCreating, isUpdating } = useEnderecosEmpresa(empresaId);
  const { data: cidades } = useCidades();
  
  const [formData, setFormData] = useState({
    nome_identificacao: '',
    endereco: '',
    bairro: '',
    cep: '',
    cidade_id: '',
    telefone: '',
    principal: false,
    horario_funcionamento: null as any,
  });

  useEffect(() => {
    if (endereco) {
      setFormData({
        nome_identificacao: endereco.nome_identificacao || '',
        endereco: endereco.endereco || '',
        bairro: endereco.bairro || '',
        cep: endereco.cep || '',
        cidade_id: endereco.cidade_id || '',
        telefone: endereco.telefone || '',
        principal: endereco.principal || false,
        horario_funcionamento: endereco.horario_funcionamento || null,
      });
    } else {
      setFormData({
        nome_identificacao: '',
        endereco: '',
        bairro: '',
        cep: '',
        cidade_id: '',
        telefone: '',
        principal: false,
        horario_funcionamento: null,
      });
    }
  }, [endereco, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dadosEndereco = {
      ...formData,
      empresa_id: empresaId,
    };

    if (endereco) {
      updateEndereco({ id: endereco.id, dados: dadosEndereco });
    } else {
      createEndereco(dadosEndereco);
    }
    
    onClose();
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {endereco ? 'Editar Endereço' : 'Adicionar Novo Endereço'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome_identificacao">Nome de Identificação *</Label>
            <Input
              id="nome_identificacao"
              placeholder="Ex: Matriz, Filial Centro, Filial Shopping..."
              value={formData.nome_identificacao}
              onChange={(e) => setFormData(prev => ({ ...prev, nome_identificacao: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="endereco">Endereço Completo *</Label>
            <Input
              id="endereco"
              placeholder="Rua, número, complemento..."
              value={formData.endereco}
              onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                placeholder="Nome do bairro"
                value={formData.bairro}
                onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                placeholder="00000-000"
                value={formData.cep}
                onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cidade">Cidade *</Label>
            <Select 
              value={formData.cidade_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, cidade_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a cidade" />
              </SelectTrigger>
              <SelectContent>
                {cidades?.map((cidade) => (
                  <SelectItem key={cidade.id} value={cidade.id}>
                    {cidade.nome} - {cidade.estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <PhoneInput
              id="telefone"
              value={formData.telefone}
              onChange={(value) => setFormData(prev => ({ ...prev, telefone: value }))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="principal"
              checked={formData.principal}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, principal: checked }))}
            />
            <Label htmlFor="principal">Definir como endereço principal</Label>
          </div>

          <div>
            <Label>Horário de Funcionamento</Label>
            <p className="text-sm text-muted-foreground">
              Configure os horários específicos para este endereço (opcional)
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isCreating || isUpdating}
            >
              {endereco ? 'Atualizar' : 'Adicionar'} Endereço
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};