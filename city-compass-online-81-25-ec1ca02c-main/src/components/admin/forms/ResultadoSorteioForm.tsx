
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Premio {
  premio: string;
  milhar: string;
  grupo: string;
}

interface ResultadoSorteioFormProps {
  dataSorteio: string;
  premios: Premio[];
  onDataSorteioChange: (data: string) => void;
  onPremiosChange: (premios: Premio[]) => void;
}

export const ResultadoSorteioForm = ({
  dataSorteio,
  premios,
  onDataSorteioChange,
  onPremiosChange
}: ResultadoSorteioFormProps) => {
  const handlePremioChange = (index: number, field: 'milhar' | 'grupo', value: string) => {
    const novosPremios = premios.map((premio, i) => 
      i === index ? { ...premio, [field]: value } : premio
    );
    onPremiosChange(novosPremios);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="data_sorteio">Data do Sorteio</Label>
        <Input
          id="data_sorteio"
          type="date"
          value={dataSorteio}
          onChange={(e) => onDataSorteioChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Resultados do Sorteio</Label>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prêmio</TableHead>
              <TableHead>Milhar</TableHead>
              <TableHead>Grupo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {premios.map((premio, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{premio.premio}</TableCell>
                <TableCell>
                  <Input
                    placeholder="0000"
                    maxLength={4}
                    value={premio.milhar}
                    onChange={(e) => handlePremioChange(index, 'milhar', e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Ex: Avestruz"
                    value={premio.grupo}
                    onChange={(e) => handlePremioChange(index, 'grupo', e.target.value)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
