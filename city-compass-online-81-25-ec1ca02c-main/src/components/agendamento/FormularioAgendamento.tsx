import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Phone, MessageSquare } from 'lucide-react';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { useServicosAgendamento } from '@/hooks/useServicosAgendamento';
import { useAuth } from '@/hooks/useAuth';

interface FormularioAgendamentoProps {
  empresaId: string;
  empresaNome?: string;
  onSuccess?: () => void;
}

export const FormularioAgendamento: React.FC<FormularioAgendamentoProps> = ({ 
  empresaId, 
  empresaNome,
  onSuccess 
}) => {
  const { user } = useAuth();
  const { criarAgendamento, isCreating } = useAgendamentos();
  const { servicos } = useServicosAgendamento(empresaId);

  const [formData, setFormData] = useState({
    nome_cliente: user?.user_metadata?.nome || '',
    telefone_cliente: user?.user_metadata?.telefone || '',
    servico: '',
    data_agendamento: '',
    observacoes: ''
  });

  const servicosAtivos = servicos.filter(s => s.ativo);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome_cliente || !formData.telefone_cliente || 
        !formData.servico || !formData.data_agendamento) {
      return;
    }

    criarAgendamento({
      empresa_id: empresaId,
      nome_cliente: formData.nome_cliente,
      telefone_cliente: formData.telefone_cliente,
      servico: formData.servico,
      data_agendamento: formData.data_agendamento,
      observacoes: formData.observacoes || undefined
    });

    // Reset form
    setFormData({
      nome_cliente: user?.user_metadata?.nome || '',
      telefone_cliente: user?.user_metadata?.telefone || '',
      servico: '',
      data_agendamento: '',
      observacoes: ''
    });

    if (onSuccess) {
      onSuccess();
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1); // Pelo menos 1 hora no futuro
    return now.toISOString().slice(0, 16);
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Agendar Horário
          {empresaNome && (
            <span className="text-sm font-normal text-muted-foreground">
              - {empresaNome}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {servicosAtivos.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Esta empresa ainda não possui serviços disponíveis para agendamento.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="nome"
                    value={formData.nome_cliente}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      nome_cliente: e.target.value
                    }))}
                    placeholder="Seu nome"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="telefone">Telefone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="telefone"
                    value={formData.telefone_cliente}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      telefone_cliente: e.target.value
                    }))}
                    placeholder="(xx) xxxxx-xxxx"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="servico">Serviço *</Label>
              <Select 
                value={formData.servico} 
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  servico: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {servicosAtivos.map((servico) => (
                    <SelectItem key={servico.id} value={servico.nome_servico}>
                      <div className="flex items-center justify-between w-full">
                        <span>{servico.nome_servico}</span>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground ml-4">
                          <Clock className="w-3 h-3" />
                          {servico.duracao_minutos}min
                          {servico.preco && (
                            <span>• R$ {servico.preco.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="data_agendamento">Data e Horário *</Label>
              <Input
                id="data_agendamento"
                type="datetime-local"
                value={formData.data_agendamento}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  data_agendamento: e.target.value
                }))}
                min={getMinDateTime()}
                required
              />
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    observacoes: e.target.value
                  }))}
                  placeholder="Alguma observação especial para o agendamento..."
                  className="pl-10 min-h-[80px]"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isCreating || !formData.nome_cliente || 
                       !formData.telefone_cliente || !formData.servico || 
                       !formData.data_agendamento}
            >
              {isCreating ? 'Agendando...' : 'Confirmar Agendamento'}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              * Campos obrigatórios. Seu agendamento será confirmado pela empresa.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
};