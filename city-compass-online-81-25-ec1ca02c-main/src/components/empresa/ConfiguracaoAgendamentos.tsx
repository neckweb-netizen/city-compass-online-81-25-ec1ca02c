import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  CalendarCheck, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  DollarSign,
  Settings2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMinhaEmpresa } from '@/hooks/useMinhaEmpresa';
import { useServicosAgendamento } from '@/hooks/useServicosAgendamento';

interface ConfiguracaoAgendamentosProps {
  empresaId: string;
}

export const ConfiguracaoAgendamentos: React.FC<ConfiguracaoAgendamentosProps> = ({ 
  empresaId 
}) => {
  const { empresa, updateEmpresa, isUpdating } = useMinhaEmpresa();
  const { 
    servicos, 
    criarServico, 
    atualizarServico, 
    excluirServico,
    isCreating,
    isDeleting 
  } = useServicosAgendamento(empresaId);

  const [modalAberto, setModalAberto] = useState(false);
  const [servicoEditando, setServicoEditando] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome_servico: '',
    descricao: '',
    duracao_minutos: 60,
    preco: ''
  });

  const [configuracaoHorarios, setConfiguracaoHorarios] = useState({
    tipo_intervalo: 'predefinido', // 'predefinido' ou 'personalizado'
    intervalo_minutos: 30,
    horarios_personalizados: [] as string[]
  });

  const [novoHorario, setNovoHorario] = useState('');

  const handleToggleAgendamentos = (ativo: boolean) => {
    updateEmpresa({
      agendamentos_ativo: ativo
    });
  };

  const handleSubmitServico = () => {
    const dados = {
      empresa_id: empresaId,
      nome_servico: formData.nome_servico,
      descricao: formData.descricao || undefined,
      duracao_minutos: formData.duracao_minutos,
      preco: formData.preco ? parseFloat(formData.preco) : undefined
    };

    if (servicoEditando) {
      atualizarServico({ 
        id: servicoEditando, 
        dados: {
          nome_servico: dados.nome_servico,
          descricao: dados.descricao,
          duracao_minutos: dados.duracao_minutos,
          preco: dados.preco
        }
      });
    } else {
      criarServico(dados);
    }

    setModalAberto(false);
    setServicoEditando(null);
    setFormData({
      nome_servico: '',
      descricao: '',
      duracao_minutos: 60,
      preco: ''
    });
  };

  const handleEditarServico = (servico: any) => {
    setServicoEditando(servico.id);
    setFormData({
      nome_servico: servico.nome_servico,
      descricao: servico.descricao || '',
      duracao_minutos: servico.duracao_minutos,
      preco: servico.preco ? servico.preco.toString() : ''
    });
    setModalAberto(true);
  };

  const adicionarHorarioPersonalizado = () => {
    if (novoHorario && !configuracaoHorarios.horarios_personalizados.includes(novoHorario)) {
      setConfiguracaoHorarios(prev => ({
        ...prev,
        horarios_personalizados: [...prev.horarios_personalizados, novoHorario].sort()
      }));
      setNovoHorario('');
    }
  };

  const removerHorarioPersonalizado = (horario: string) => {
    setConfiguracaoHorarios(prev => ({
      ...prev,
      horarios_personalizados: prev.horarios_personalizados.filter(h => h !== horario)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Configuração Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-primary" />
            Sistema de Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">
                Habilitar Agendamentos Online
              </Label>
              <p className="text-sm text-muted-foreground">
                Permita que seus clientes agendem serviços diretamente pelo sistema
              </p>
            </div>
            <Switch
              checked={empresa?.agendamentos_ativo || false}
              onCheckedChange={handleToggleAgendamentos}
              disabled={isUpdating}
            />
          </div>
        </CardContent>
      </Card>

      {/* Serviços Disponíveis */}
      {empresa?.agendamentos_ativo && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Serviços Disponíveis para Agendamento</CardTitle>
            
            <Dialog open={modalAberto} onOpenChange={setModalAberto}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setServicoEditando(null);
                    setFormData({
                      nome_servico: '',
                      descricao: '',
                      duracao_minutos: 60,
                      preco: ''
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Serviço
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {servicoEditando ? 'Editar Serviço' : 'Novo Serviço'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome_servico">Nome do Serviço *</Label>
                    <Input
                      id="nome_servico"
                      value={formData.nome_servico}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        nome_servico: e.target.value
                      }))}
                      placeholder="Ex: Corte de cabelo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        descricao: e.target.value
                      }))}
                      placeholder="Descrição detalhada do serviço"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="duracao">Duração (minutos)</Label>
                      <Input
                        id="duracao"
                        type="number"
                        value={formData.duracao_minutos}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          duracao_minutos: parseInt(e.target.value) || 60
                        }))}
                        min="15"
                        max="480"
                      />
                    </div>

                    <div>
                      <Label htmlFor="preco">Preço (R$)</Label>
                      <Input
                        id="preco"
                        type="number"
                        step="0.01"
                        value={formData.preco}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          preco: e.target.value
                        }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSubmitServico}
                      disabled={!formData.nome_servico || isCreating}
                      className="flex-1"
                    >
                      {servicoEditando ? 'Atualizar' : 'Criar'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setModalAberto(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent>
            {servicos.length === 0 ? (
              <div className="text-center py-8">
                <CalendarCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum serviço cadastrado</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Adicione serviços para permitir agendamentos online
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {servicos.map((servico) => (
                  <div 
                    key={servico.id} 
                    className="p-4 border rounded-lg bg-card"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{servico.nome_servico}</h4>
                        {servico.descricao && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {servico.descricao}
                          </p>
                        )}
                      </div>
                      <Badge variant={servico.ativo ? 'default' : 'secondary'}>
                        {servico.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {servico.duracao_minutos} min
                      </div>
                      {servico.preco && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          R$ {servico.preco.toFixed(2)}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditarServico(servico)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => atualizarServico({
                          id: servico.id,
                          dados: { ativo: !servico.ativo }
                        })}
                      >
                        {servico.ativo ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => excluirServico(servico.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuração de Horários */}
      {empresa?.agendamentos_ativo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              Configuração de Horários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Horários</Label>
                <Select 
                  value={configuracaoHorarios.tipo_intervalo} 
                  onValueChange={(value) => setConfiguracaoHorarios(prev => ({
                    ...prev,
                    tipo_intervalo: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="predefinido">Intervalos Pré-definidos</SelectItem>
                    <SelectItem value="personalizado">Horários Específicos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {configuracaoHorarios.tipo_intervalo === 'predefinido' && (
                <div className="space-y-2">
                  <Label>Intervalo entre Horários (minutos)</Label>
                  <Select 
                    value={configuracaoHorarios.intervalo_minutos.toString()} 
                    onValueChange={(value) => setConfiguracaoHorarios(prev => ({
                      ...prev,
                      intervalo_minutos: parseInt(value)
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="20">20 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Horários serão gerados automaticamente das 8h às 18h com este intervalo
                  </p>
                </div>
              )}

              {configuracaoHorarios.tipo_intervalo === 'personalizado' && (
                <div className="space-y-4">
                  <Label>Horários Específicos</Label>
                  <div className="text-sm text-muted-foreground">
                    Defina horários específicos que estarão disponíveis para agendamento
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={novoHorario}
                      onChange={(e) => setNovoHorario(e.target.value)}
                      placeholder="Selecione um horário"
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={adicionarHorarioPersonalizado}
                      disabled={!novoHorario}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>

                  {configuracaoHorarios.horarios_personalizados.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Horários Configurados:</Label>
                      <div className="flex flex-wrap gap-2">
                        {configuracaoHorarios.horarios_personalizados.map((horario) => (
                          <div 
                            key={horario}
                            className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-sm"
                          >
                            <Clock className="w-3 h-3" />
                            <span>{horario}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 hover:bg-transparent"
                              onClick={() => removerHorarioPersonalizado(horario)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};