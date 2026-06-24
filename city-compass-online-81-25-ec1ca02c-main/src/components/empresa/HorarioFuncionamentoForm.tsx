
import { useState } from 'react';
import { useMinhaEmpresa } from '@/hooks/useMinhaEmpresa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Clock, Save } from 'lucide-react';

interface HorarioFuncionamento {
  [key: string]: {
    aberto: boolean;
    abertura: string;
    fechamento: string;
  };
}

const diasSemana = [
  { key: 'segunda', nome: 'Segunda-feira' },
  { key: 'terca', nome: 'Terça-feira' },
  { key: 'quarta', nome: 'Quarta-feira' },
  { key: 'quinta', nome: 'Quinta-feira' },
  { key: 'sexta', nome: 'Sexta-feira' },
  { key: 'sabado', nome: 'Sábado' },
  { key: 'domingo', nome: 'Domingo' },
];

export const HorarioFuncionamentoForm = () => {
  const { empresa, updateEmpresa, isUpdating } = useMinhaEmpresa();
  
  const [horarios, setHorarios] = useState<HorarioFuncionamento>(() => {
    const horariosIniciais: HorarioFuncionamento = {};
    
    diasSemana.forEach(dia => {
      horariosIniciais[dia.key] = {
        aberto: true,
        abertura: '08:00',
        fechamento: '18:00'
      };
    });

    // Se já existem horários salvos, usar eles
    if (empresa?.horario_funcionamento) {
      Object.keys(empresa.horario_funcionamento).forEach(dia => {
        if (horariosIniciais[dia]) {
          horariosIniciais[dia] = empresa.horario_funcionamento[dia];
        }
      });
    }

    return horariosIniciais;
  });

  const handleToggleDay = (dia: string) => {
    setHorarios(prev => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        aberto: !prev[dia].aberto
      }
    }));
  };

  const handleTimeChange = (dia: string, tipo: 'abertura' | 'fechamento', valor: string) => {
    setHorarios(prev => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [tipo]: valor
      }
    }));
  };

  const handleSave = () => {
    updateEmpresa({
      horario_funcionamento: horarios
    });
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Clock className="h-5 w-5 text-blue-600" />
          Horário de Funcionamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {diasSemana.map((dia) => (
          <div key={dia.key} className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">{dia.nome}</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Fechado</span>
                <Switch
                  checked={horarios[dia.key]?.aberto || false}
                  onCheckedChange={() => handleToggleDay(dia.key)}
                />
                <span className="text-sm text-gray-500">Aberto</span>
              </div>
            </div>
            
            {horarios[dia.key]?.aberto && (
              <div className="grid grid-cols-2 gap-4 ml-4">
                <div>
                  <Label className="text-xs text-gray-500">Abertura</Label>
                  <Input
                    type="time"
                    value={horarios[dia.key]?.abertura || '08:00'}
                    onChange={(e) => handleTimeChange(dia.key, 'abertura', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Fechamento</Label>
                  <Input
                    type="time"
                    value={horarios[dia.key]?.fechamento || '18:00'}
                    onChange={(e) => handleTimeChange(dia.key, 'fechamento', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
            
            {dia.key !== 'domingo' && <Separator />}
          </div>
        ))}
        
        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {isUpdating ? 'Salvando...' : 'Salvar Horários'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
