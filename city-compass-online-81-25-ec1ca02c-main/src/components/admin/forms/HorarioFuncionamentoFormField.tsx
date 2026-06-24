import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Clock } from 'lucide-react';
import { HorarioFuncionamento, diasSemana } from '@/types/horarios';

interface HorarioFuncionamentoFormFieldProps {
  value?: HorarioFuncionamento;
  onChange: (horarios: HorarioFuncionamento) => void;
}

export const HorarioFuncionamentoFormField = ({ value, onChange }: HorarioFuncionamentoFormFieldProps) => {
  const [horarios, setHorarios] = useState<HorarioFuncionamento>(() => {
    const horariosIniciais: HorarioFuncionamento = {};
    
    diasSemana.forEach(dia => {
      horariosIniciais[dia.key] = {
        aberto: true,
        abertura: '08:00',
        fechamento: '18:00'
      };
    });

    // Se já existem horários, usar eles
    if (value) {
      Object.keys(value).forEach(dia => {
        if (horariosIniciais[dia]) {
          horariosIniciais[dia] = value[dia];
        }
      });
    }

    return horariosIniciais;
  });

  const handleToggleDay = (dia: string) => {
    const novosHorarios = {
      ...horarios,
      [dia]: {
        ...horarios[dia],
        aberto: !horarios[dia].aberto
      }
    };
    setHorarios(novosHorarios);
    onChange(novosHorarios);
  };

  const handleTimeChange = (dia: string, tipo: 'abertura' | 'fechamento', valor: string) => {
    const novosHorarios = {
      ...horarios,
      [dia]: {
        ...horarios[dia],
        [tipo]: valor
      }
    };
    setHorarios(novosHorarios);
    onChange(novosHorarios);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Horário de Funcionamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {diasSemana.map((dia) => (
          <div key={dia.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{dia.nome}</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Fechado</span>
                <Switch
                  checked={horarios[dia.key]?.aberto || false}
                  onCheckedChange={() => handleToggleDay(dia.key)}
                />
                <span className="text-xs text-muted-foreground">Aberto</span>
              </div>
            </div>
            
            {horarios[dia.key]?.aberto && (
              <div className="grid grid-cols-2 gap-3 ml-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Abertura</Label>
                  <Input
                    type="time"
                    value={horarios[dia.key]?.abertura || '08:00'}
                    onChange={(e) => handleTimeChange(dia.key, 'abertura', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Fechamento</Label>
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
      </CardContent>
    </Card>
  );
};