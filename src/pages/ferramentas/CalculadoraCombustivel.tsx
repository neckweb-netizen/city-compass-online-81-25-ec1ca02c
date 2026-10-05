import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CarFront, Fuel, Gauge, MapPin, UsersRound } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToolBanner } from '@/components/ferramentas/ToolBanner';

const numberFrom = (value: string) => Number(value.replace(',', '.')) || 0;
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

export default function CalculadoraCombustivel() {
  const navigate = useNavigate();
  const [distancia, setDistancia] = useState('');
  const [consumo, setConsumo] = useState('');
  const [preco, setPreco] = useState('');
  const [pedagios, setPedagios] = useState('');
  const [passageiros, setPassageiros] = useState('1');
  const [idaVolta, setIdaVolta] = useState(false);
  const [combustivel, setCombustivel] = useState('Gasolina');
  const [gasolina, setGasolina] = useState('');
  const [etanol, setEtanol] = useState('');

  const viagem = useMemo(() => {
    const km = numberFrom(distancia) * (idaVolta ? 2 : 1);
    const kmLitro = numberFrom(consumo);
    const valorLitro = numberFrom(preco);
    const litros = kmLitro > 0 ? km / kmLitro : 0;
    const combustivelTotal = litros * valorLitro;
    const total = combustivelTotal + numberFrom(pedagios);
    const pessoas = Math.max(1, Math.floor(numberFrom(passageiros)));
    return { km, litros, combustivelTotal, total, porPessoa: total / pessoas, valido: km > 0 && kmLitro > 0 && valorLitro > 0 };
  }, [consumo, distancia, idaVolta, passageiros, pedagios, preco]);

  const comparacao = useMemo(() => {
    const gas = numberFrom(gasolina);
    const eta = numberFrom(etanol);
    const percentual = gas > 0 ? (eta / gas) * 100 : 0;
    return { percentual, recomendado: percentual > 0 && percentual <= 70 ? 'Etanol' : 'Gasolina', valido: gas > 0 && eta > 0 };
  }, [etanol, gasolina]);

  return <div className="min-h-screen bg-muted/20 px-3 pb-24 pt-4 sm:px-6 sm:py-8">
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => navigate('/ferramentas')}><ArrowLeft className="mr-2 h-4 w-4" />Ferramentas</Button>
        <Badge variant="outline"><Fuel className="mr-1 h-3.5 w-3.5" />Cálculo gratuito</Badge>
      </div>

      <header className="space-y-2 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/15 text-amber-600"><Fuel className="h-7 w-7" /></div><h1 className="text-3xl font-black sm:text-4xl">Combustível e custo da viagem</h1><p className="mx-auto max-w-2xl text-sm text-muted-foreground">Calcule litros, gasto total, divisão entre passageiros e compare gasolina com etanol.</p></header>
      <ToolBanner secao="ferramentas" />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-amber-600" />Planejar viagem</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="distancia">Distância de ida (km)</Label><Input id="distancia" inputMode="decimal" value={distancia} onChange={event => setDistancia(event.target.value)} placeholder="Ex.: 100" /></div>
            <div className="space-y-2"><Label htmlFor="consumo">Consumo médio (km/l)</Label><Input id="consumo" inputMode="decimal" value={consumo} onChange={event => setConsumo(event.target.value)} placeholder="Ex.: 12" /></div>
            <div className="space-y-2"><Label>Combustível</Label><Select value={combustivel} onValueChange={setCombustivel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Gasolina">Gasolina</SelectItem><SelectItem value="Etanol">Etanol</SelectItem><SelectItem value="Diesel">Diesel</SelectItem><SelectItem value="GNV">GNV</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="preco">Preço do {combustivel.toLowerCase()}</Label><Input id="preco" inputMode="decimal" value={preco} onChange={event => setPreco(event.target.value)} placeholder="Ex.: 6,19" /></div>
            <div className="space-y-2"><Label htmlFor="pedagios">Pedágios e outros custos</Label><Input id="pedagios" inputMode="decimal" value={pedagios} onChange={event => setPedagios(event.target.value)} placeholder="Opcional" /></div>
            <div className="space-y-2"><Label htmlFor="passageiros">Pessoas dividindo</Label><Input id="passageiros" type="number" min="1" max="20" value={passageiros} onChange={event => setPassageiros(event.target.value)} /></div>
          </div>
          <Label className="flex items-center justify-between rounded-xl border p-3"><span><span className="block font-bold">Calcular ida e volta</span><span className="text-xs font-normal text-muted-foreground">Dobra automaticamente a distância informada</span></span><Switch checked={idaVolta} onCheckedChange={setIdaVolta} /></Label>

          {viagem.valido ? <div className="grid gap-3 rounded-2xl bg-amber-500/10 p-4 sm:grid-cols-2">
            <div><p className="text-xs text-muted-foreground">Distância calculada</p><p className="text-xl font-black">{decimal.format(viagem.km)} km</p></div>
            <div><p className="text-xs text-muted-foreground">Combustível necessário</p><p className="text-xl font-black">{decimal.format(viagem.litros)} litros</p></div>
            <div><p className="text-xs text-muted-foreground">Gasto com combustível</p><p className="text-xl font-black">{currency.format(viagem.combustivelTotal)}</p></div>
            <div><p className="text-xs text-muted-foreground">Total da viagem</p><p className="text-xl font-black text-amber-700 dark:text-amber-400">{currency.format(viagem.total)}</p></div>
            <div className="sm:col-span-2"><p className="flex items-center gap-1 text-xs text-muted-foreground"><UsersRound className="h-3.5 w-3.5" />Valor por pessoa</p><p className="text-2xl font-black">{currency.format(viagem.porPessoa)}</p></div>
          </div> : <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground"><Gauge className="mx-auto mb-2 h-6 w-6" />Preencha distância, consumo e preço para ver o resultado.</div>}
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2"><CarFront className="h-5 w-5 text-emerald-600" />Gasolina ou etanol?</CardTitle></CardHeader><CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">A regra prática recomenda etanol quando ele custa até 70% do preço da gasolina.</p>
          <div className="space-y-2"><Label htmlFor="gasolina">Preço da gasolina</Label><Input id="gasolina" inputMode="decimal" value={gasolina} onChange={event => setGasolina(event.target.value)} placeholder="Ex.: 6,19" /></div>
          <div className="space-y-2"><Label htmlFor="etanol">Preço do etanol</Label><Input id="etanol" inputMode="decimal" value={etanol} onChange={event => setEtanol(event.target.value)} placeholder="Ex.: 4,09" /></div>
          {comparacao.valido && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center"><p className="text-sm text-muted-foreground">O etanol custa {decimal.format(comparacao.percentual)}% da gasolina</p><p className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-400">Abasteça com {comparacao.recomendado}</p></div>}
          <Alert><Fuel className="h-4 w-4" /><AlertTitle>Estimativa</AlertTitle><AlertDescription>Consumo real varia conforme veículo, trânsito, carga, pneus e estilo de condução.</AlertDescription></Alert>
        </CardContent></Card>
      </div>
    </div>
  </div>;
}
