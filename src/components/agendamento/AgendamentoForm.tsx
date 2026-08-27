import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle2, Clock, Loader2, Phone, User } from 'lucide-react';
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
    data: '',
    horario: '',
    observacoes: ''
  });

  const { criarAgendamento, isCreating } = useAgendamentos();
  const { servicos } = useServicosAgendamento(empresaId);

  const servicoSelecionado = servicos.find((servico) => servico.nome_servico === formData.servico);
  const dataMinima = useMemo(() => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bahia', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date()), []);

  const { data: horarios = [], isFetching: carregandoHorarios } = useQuery({
    queryKey: ['horarios-agendamento', empresaId, formData.servico, formData.data],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('listar_horarios_agendamento', {
        p_empresa_id: empresaId,
        p_servico: formData.servico,
        p_data: formData.data,
      });
      if (error) throw error;
      return (data || []) as Array<{ horario: string }>;
    },
    enabled: Boolean(formData.servico && formData.data),
    staleTime: 15_000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome_cliente || !formData.telefone_cliente || !formData.servico || !formData.horario) {
      return;
    }

    try {
      await criarAgendamento({
        empresa_id: empresaId,
        nome_cliente: formData.nome_cliente,
        telefone_cliente: formData.telefone_cliente,
        servico: formData.servico,
        data_agendamento: formData.horario,
        observacoes: formData.observacoes,
      });
      setFormData({ nome_cliente: '', telefone_cliente: '', servico: '', data: '', horario: '', observacoes: '' });
      onSuccess?.();
    } catch {
      // O hook mantém o formulário aberto e mostra a mensagem retornada pelo servidor.
    }
  };

  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '').slice(0, 11);
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 6) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    if (numeros.length <= 10) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  };

  const horaLocal = (iso: string) => new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Bahia', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(new Date(iso));

  const preco = servicoSelecionado?.preco
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(servicoSelecionado.preco)
    : null;

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
              onChange={(e) => setFormData(prev => ({ ...prev, telefone_cliente: formatarTelefone(e.target.value) }))}
              placeholder="(00) 00000-0000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="servico">Serviço</Label>
            <Select 
              value={formData.servico} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, servico: value, horario: '' }))}
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
                        {servico.preco != null && <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(servico.preco)}</span>}
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {servicoSelecionado && <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3 text-sm"><CheckCircle2 className="h-5 w-5 text-primary"/><div><b>{servicoSelecionado.nome_servico}</b><p className="text-muted-foreground">{servicoSelecionado.duracao_minutos} minutos{preco ? ` · ${preco}` : ''}</p></div></div>}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value, horario: '' }))}
                min={dataMinima}
                disabled={!formData.servico}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Horários disponíveis
              </Label>
              {!formData.data ? <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">Escolha o serviço e a data.</p> : carregandoHorarios ? <div className="flex items-center justify-center gap-2 rounded-xl border p-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Consultando agenda...</div> : horarios.length === 0 ? <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">Não há horários livres nesta data. Escolha outro dia.</p> : <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{horarios.map(({ horario }) => <Button key={horario} type="button" size="sm" variant={formData.horario === horario ? 'default' : 'outline'} className="h-10 rounded-xl" onClick={() => setFormData(prev => ({ ...prev, horario }))}>{horaLocal(horario)}</Button>)}</div>}
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
            disabled={isCreating || !formData.horario}
          >
            {isCreating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Reservando...</> : 'Solicitar agendamento'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">A empresa receberá sua solicitação e poderá confirmá-la. Horários ocupados são bloqueados automaticamente.</p>
        </form>
      </CardContent>
    </Card>
  );
};
