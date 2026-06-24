import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, Phone } from 'lucide-react';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { useServicosAgendamento } from '@/hooks/useServicosAgendamento';

interface AgendamentoFormProps {
  empresaId: string;
  empresaNome: string;
  onSuccess?: () => void;
}


export const AgendamentoForm: React.FC<AgendamentoFormProps> = ({
  empresaId,
  empresaNome,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    nome_cliente: '',
    telefone_cliente: '',
    servico: '',
    data_agendamento: '',
    observacoes: ''
  });

  const { criarAgendamento, isCreating } = useAgendamentos();
  const { servicos } = useServicosAgendamento(empresaId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome_cliente || !formData.telefone_cliente || !formData.servico || !formData.data_agendamento) {
      return;
    }

    criarAgendamento({
      empresa_id: empresaId,
      ...formData
    });

    if (onSuccess) {
      onSuccess();
    }

    // Reset form
    setFormData({
      nome_cliente: '',
      telefone_cliente: '',
      servico: '',
      data_agendamento: '',
      observacoes: ''
    });
  };

  const generateTimeSlots = (intervalMinutes = 30) => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Agendar Serviço
        </CardTitle>
        <CardDescription>
          Agende seu horário em {empresaNome}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Nome completo
            </Label>
            <Input
              id="nome"
              type="text"
              value={formData.nome_cliente}
              onChange={(e) => setFormData(prev => ({ ...prev, nome_cliente: e.target.value }))}
              placeholder="Seu nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Telefone
            </Label>
            <Input
              id="telefone"
              type="tel"
              value={formData.telefone_cliente}
              onChange={(e) => setFormData(prev => ({ ...prev, telefone_cliente: e.target.value }))}
              placeholder="(00) 00000-0000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="servico">Serviço</Label>
            <Select 
              value={formData.servico} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, servico: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent>
                {servicos.filter(s => s.ativo).length === 0 ? (
                  <SelectItem value="" disabled>
                    Nenhum serviço disponível para agendamento
                  </SelectItem>
                ) : (
                  servicos.filter(s => s.ativo).map((servico) => (
                    <SelectItem key={servico.id} value={servico.nome_servico}>
                      <div className="flex justify-between items-center w-full">
                        <span>{servico.nome_servico}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{servico.duracao_minutos} min</span>
                          {servico.preco && <span>R$ {servico.preco.toFixed(2)}</span>}
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={formData.data_agendamento.split('T')[0]}
                onChange={(e) => {
                  const currentTime = formData.data_agendamento.split('T')[1] || '09:00';
                  setFormData(prev => ({ 
                    ...prev, 
                    data_agendamento: `${e.target.value}T${currentTime}` 
                  }));
                }}
                min={getMinDate()}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hora" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horário
              </Label>
              <Select 
                value={formData.data_agendamento.split('T')[1]?.substring(0, 5) || ''} 
                onValueChange={(time) => {
                  const currentDate = formData.data_agendamento.split('T')[0] || getMinDate();
                  setFormData(prev => ({ 
                    ...prev, 
                    data_agendamento: `${currentDate}T${time}:00.000Z` 
                  }));
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Horário" />
                </SelectTrigger>
                <SelectContent>
                  {generateTimeSlots().map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Alguma observação especial..."
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isCreating}
          >
            {isCreating ? 'Agendando...' : 'Confirmar Agendamento'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};