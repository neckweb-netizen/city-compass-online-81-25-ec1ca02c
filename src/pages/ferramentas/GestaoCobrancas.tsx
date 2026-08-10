import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, NotebookPen, Plus, Trash2, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ToolBanner = ({ secao }: { secao: string }) => {
  const [banners, setBanners] = useState<any[]>([]);

  useEffect(() => {
    const buscarBanners = async () => {
      try {
        const { data } = await supabase
          .from('banners' as any)
          .select('*')
          .eq('ativo', true)
          .in('secao', [secao, 'ferramentas'])
          .order('ordem', { ascending: true });

        if (data && data.length > 0) {
          setBanners(data);
        }
      } catch (err) {
        console.error(`Erro ao carregar banners para ${secao}:`, err);
      }
    };

    buscarBanners();
  }, [secao]);

  if (banners.length === 0) return null;

  return (
    <div className="w-full space-y-3 my-4">
      {banners.map((b) => {
        if (b.tipo_midia === 'codigo' && b.codigo_html) {
          return (
            <div 
              key={b.id} 
              className="w-full rounded-2xl overflow-hidden shadow-sm border border-border/60 bg-card p-2 text-center"
              dangerouslySetInnerHTML={{ __html: b.codigo_html }}
            />
          );
        }

        return (
          <a
            key={b.id}
            href={b.link_url || b.link_destino || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-2xl overflow-hidden shadow-sm border border-border/60 hover:opacity-95 transition-opacity"
          >
            <img
              src={b.imagem_url || b.imagem}
              alt={b.titulo || 'Banner de Anúncio'}
              className="w-full h-auto max-h-[160px] sm:max-h-[220px] object-cover"
            />
          </a>
        );
      })}
    </div>
  );
};

interface CobrancaItem {
  id: string;
  cliente: string;
  valor: number;
  vencimento: string;
  pago: boolean;
}

export const GestaoCobrancas = () => {
  const navigate = useNavigate();
  const [lista, setLista] = useState<CobrancaItem[]>([]);
  const [cliente, setCliente] = useState('');
  const [valor, setValor] = useState('');
  const [vencimento, setVencimento] = useState('');

  const handleAdicionar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente || !valor) {
      toast.error('Informe o cliente e o valor.');
      return;
    }

    const novoItem: CobrancaItem = {
      id: Date.now().toString(),
      cliente,
      valor: parseFloat(valor.replace(',', '.')),
      vencimento: vencimento || new Date().toISOString().split('T')[0],
      pago: false,
    };

    setLista([...lista, novoItem]);
    setCliente('');
    setValor('');
    setVencimento('');
    toast.success('Cobrança registrada!');
  };

  const handleAlternarPago = (id: string) => {
    setLista(prev => prev.map(item => item.id === id ? { ...item, pago: !item.pago } : item));
  };

  const handleRemover = (id: string) => {
    setLista(prev => prev.filter(item => item.id !== id));
  };

  const totalAReceber = lista.filter(i => !i.pago).reduce((acc, i) => acc + i.valor, 0);

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/ferramentas')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar para Ferramentas
          </Button>
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1 text-xs font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Micro CRM
          </Badge>
        </div>

        <ToolBanner secao="gestao_cobrancas" />

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-foreground flex items-center justify-center gap-2">
            <NotebookPen className="w-8 h-8 text-amber-500" /> Caderno de Cobranças
          </h1>
          <p className="text-muted-foreground text-sm">Controle seus clientes, contas a receber e vencimentos em um só lugar.</p>
        </div>

        <Card className="border-border/60 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold">Registrar Nova Cobrança</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdicionar} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold">Cliente / Empresa</Label>
                <Input placeholder="Ex: Mercado Central" value={cliente} onChange={e => setCliente(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Valor (R$)</Label>
                <Input placeholder="100,00" value={valor} onChange={e => setValor(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Vencimento</Label>
                <Input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} />
              </div>
              <Button type="submit" className="sm:col-span-4 bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 gap-2 text-xs mt-2">
                <Plus className="w-4 h-4" /> Adicionar Lançamento
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Lançamentos de Cobrança</CardTitle>
              <CardDescription className="text-xs">A receber: R$ {totalAReceber.toFixed(2)}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {lista.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">Nenhuma cobrança lançada até o momento.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lista.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-bold text-xs">{item.cliente}</TableCell>
                      <TableCell className="text-xs font-mono">R$ {item.valor.toFixed(2)}</TableCell>
                      <TableCell className="text-xs">{item.vencimento.split('-').reverse().join('/')}</TableCell>
                      <TableCell>
                        <button onClick={() => handleAlternarPago(item.id)}>
                          {item.pago ? (
                            <Badge className="bg-emerald-600 text-white text-[10px] gap-1"><CheckCircle2 className="w-3 h-3" /> PAGO</Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-500 text-[10px] gap-1"><Clock className="w-3 h-3" /> PENDENTE</Badge>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleRemover(item.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GestaoCobrancas;
