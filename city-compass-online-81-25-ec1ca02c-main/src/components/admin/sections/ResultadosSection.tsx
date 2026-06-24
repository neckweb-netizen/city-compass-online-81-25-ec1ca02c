
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Save, Trash2, Edit } from 'lucide-react';

interface ResultadoItem {
  id: string;
  titulo: string;
  data_sorteio: string;
  premios: {
    premio: string;
    milhar: string;
    grupo: string;
  }[];
  criado_em: string;
}

export const ResultadosSection = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [resultados, setResultados] = useState<ResultadoItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [novoResultado, setNovoResultado] = useState({
    titulo: '',
    data_sorteio: '',
    premios: [
      { premio: '1º', milhar: '', grupo: '' },
      { premio: '2º', milhar: '', grupo: '' },
      { premio: '3º', milhar: '', grupo: '' },
      { premio: '4º', milhar: '', grupo: '' },
      { premio: '5º', milhar: '', grupo: '' }
    ]
  });

  const handleSalvarResultado = () => {
    if (!novoResultado.titulo || !novoResultado.data_sorteio) {
      alert('Por favor, preencha título e data do sorteio');
      return;
    }

    const resultado: ResultadoItem = {
      id: Date.now().toString(),
      titulo: novoResultado.titulo,
      data_sorteio: novoResultado.data_sorteio,
      premios: novoResultado.premios,
      criado_em: new Date().toISOString()
    };

    if (editingId) {
      setResultados(prev => prev.map(r => r.id === editingId ? resultado : r));
      setEditingId(null);
    } else {
      setResultados(prev => [...prev, resultado]);
    }

    // Reset form
    setNovoResultado({
      titulo: '',
      data_sorteio: '',
      premios: [
        { premio: '1º', milhar: '', grupo: '' },
        { premio: '2º', milhar: '', grupo: '' },
        { premio: '3º', milhar: '', grupo: '' },
        { premio: '4º', milhar: '', grupo: '' },
        { premio: '5º', milhar: '', grupo: '' }
      ]
    });

    setActiveTab('list');
  };

  const handleEditarResultado = (resultado: ResultadoItem) => {
    setNovoResultado({
      titulo: resultado.titulo,
      data_sorteio: resultado.data_sorteio,
      premios: resultado.premios
    });
    setEditingId(resultado.id);
    setActiveTab('create');
  };

  const handleRemoverResultado = (id: string) => {
    if (confirm('Tem certeza que deseja remover este resultado?')) {
      setResultados(prev => prev.filter(r => r.id !== id));
    }
  };

  const handlePremioChange = (index: number, field: 'milhar' | 'grupo', value: string) => {
    setNovoResultado(prev => ({
      ...prev,
      premios: prev.premios.map((premio, i) => 
        i === index ? { ...premio, [field]: value } : premio
      )
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resultados de Sorteios</h2>
          <p className="text-muted-foreground">
            Gerencie os resultados dos sorteios com prêmios, milhares e grupos
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Resultados</TabsTrigger>
          <TabsTrigger value="create">
            {editingId ? 'Editar Resultado' : 'Novo Resultado'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {resultados.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="text-muted-foreground mb-4">
                  Nenhum resultado encontrado
                </div>
                <Button onClick={() => setActiveTab('create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Resultado
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {resultados.map((resultado) => (
                <Card key={resultado.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{resultado.titulo}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Data: {new Date(resultado.data_sorteio).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditarResultado(resultado)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoverResultado(resultado.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Prêmio</TableHead>
                          <TableHead>Milhar</TableHead>
                          <TableHead>Grupo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultado.premios.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.premio}</TableCell>
                            <TableCell>{item.milhar || '-'}</TableCell>
                            <TableCell>{item.grupo || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? 'Editar Resultado' : 'Novo Resultado'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título do Sorteio</label>
                  <Input
                    placeholder="Ex: Sorteio da Semana"
                    value={novoResultado.titulo}
                    onChange={(e) => setNovoResultado(prev => ({ ...prev, titulo: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data do Sorteio</label>
                  <Input
                    type="date"
                    value={novoResultado.data_sorteio}
                    onChange={(e) => setNovoResultado(prev => ({ ...prev, data_sorteio: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Resultados</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prêmio</TableHead>
                      <TableHead>Milhar</TableHead>
                      <TableHead>Grupo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {novoResultado.premios.map((premio, index) => (
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

              <div className="flex gap-2">
                <Button onClick={handleSalvarResultado}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingId ? 'Atualizar' : 'Salvar'} Resultado
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveTab('list');
                    setEditingId(null);
                    setNovoResultado({
                      titulo: '',
                      data_sorteio: '',
                      premios: [
                        { premio: '1º', milhar: '', grupo: '' },
                        { premio: '2º', milhar: '', grupo: '' },
                        { premio: '3º', milhar: '', grupo: '' },
                        { premio: '4º', milhar: '', grupo: '' },
                        { premio: '5º', milhar: '', grupo: '' }
                      ]
                    });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
