import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bike,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Copy,
  Fuel,
  Hash,
  Loader2,
  RefreshCw,
  Search,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type VehicleType = 'cars' | 'motorcycles' | 'trucks';
type Option = { code: string; name: string };
type Reference = { code: string; month: string };

interface FipeDetails {
  brand: string;
  codeFipe: string;
  fuel: string;
  fuelAcronym?: string;
  model: string;
  modelYear: number;
  price: string;
  referenceMonth: string;
  vehicleType: number;
}

const vehicleOptions: Array<{ value: VehicleType; label: string; icon: typeof CarFront }> = [
  { value: 'cars', label: 'Carros', icon: CarFront },
  { value: 'motorcycles', label: 'Motos', icon: Bike },
  { value: 'trucks', label: 'Caminhões', icon: Truck },
];

async function queryFipe<T>(body: Record<string, string>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('fipe-consulta', { body });
  if (error) throw new Error('Não foi possível concluir a consulta. Tente novamente.');
  if (data?.error) throw new Error(data.error);
  return data.data as T;
}

export const ConsultaFipe = () => {
  const navigate = useNavigate();
  const [vehicleType, setVehicleType] = useState<VehicleType>('cars');
  const [reference, setReference] = useState('');
  const [brandId, setBrandId] = useState('');
  const [modelId, setModelId] = useState('');
  const [yearId, setYearId] = useState('');
  const [references, setReferences] = useState<Reference[]>([]);
  const [brands, setBrands] = useState<Option[]>([]);
  const [models, setModels] = useState<Option[]>([]);
  const [years, setYears] = useState<Option[]>([]);
  const [result, setResult] = useState<FipeDetails | null>(null);
  const [loading, setLoading] = useState('initial');

  const loadInitial = useCallback(async () => {
    setLoading('initial');
    setResult(null);
    setBrandId('');
    setModelId('');
    setYearId('');
    setModels([]);
    setYears([]);
    try {
      const refs = await queryFipe<Reference[]>({ action: 'references' });
      const latestReference = refs[0]?.code ?? '';
      setReferences(refs.slice(0, 24));
      setReference(latestReference);
      const brandList = await queryFipe<Option[]>({ action: 'brands', vehicleType, reference: latestReference });
      setBrands(brandList);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar a Tabela FIPE.');
    } finally {
      setLoading('');
    }
  }, [vehicleType]);

  useEffect(() => {
    setBrandId('');
    setModelId('');
    setYearId('');
    setModels([]);
    setYears([]);
    void loadInitial();
  }, [loadInitial]);

  const changeReference = async (value: string) => {
    setReference(value);
    setBrandId('');
    setModelId('');
    setYearId('');
    setModels([]);
    setYears([]);
    setResult(null);
    setLoading('brands');
    try {
      setBrands(await queryFipe<Option[]>({ action: 'brands', vehicleType, reference: value }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar marcas.');
    } finally {
      setLoading('');
    }
  };

  const changeBrand = async (value: string) => {
    setBrandId(value);
    setModelId('');
    setYearId('');
    setModels([]);
    setYears([]);
    setResult(null);
    setLoading('models');
    try {
      setModels(await queryFipe<Option[]>({ action: 'models', vehicleType, brandId: value, reference }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar modelos.');
    } finally {
      setLoading('');
    }
  };

  const changeModel = async (value: string) => {
    setModelId(value);
    setYearId('');
    setYears([]);
    setResult(null);
    setLoading('years');
    try {
      setYears(await queryFipe<Option[]>({ action: 'years', vehicleType, brandId, modelId: value, reference }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar anos.');
    } finally {
      setLoading('');
    }
  };

  const consult = async () => {
    if (!brandId || !modelId || !yearId) return;
    setLoading('details');
    setResult(null);
    try {
      setResult(await queryFipe<FipeDetails>({ action: 'details', vehicleType, brandId, modelId, yearId, reference }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao consultar o veículo.');
    } finally {
      setLoading('');
    }
  };

  const selectedReference = useMemo(
    () => references.find((item) => item.code === reference)?.month,
    [reference, references],
  );

  const copyResult = async () => {
    if (!result) return;
    const text = `${result.brand} ${result.model} (${result.modelYear})\nValor FIPE: ${result.price}\nCódigo FIPE: ${result.codeFipe}\nReferência: ${result.referenceMonth}`;
    await navigator.clipboard.writeText(text);
    toast.success('Dados da consulta copiados.');
  };

  const isBusy = Boolean(loading);

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => navigate('/ferramentas')} className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar para Ferramentas
          </Button>
          <Badge className="border-sky-500/20 bg-sky-500/10 px-3 py-1 text-sky-600 dark:text-sky-300">
            Consulta atualizada
          </Badge>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="flex items-center justify-center gap-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            <CarFront className="h-9 w-9 text-sky-500" /> Consulta Tabela FIPE
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            Consulte o preço médio nacional de carros, motos e caminhões por marca, modelo e ano.
          </p>
        </div>

        <Card className="overflow-hidden border-border/60 shadow-lg">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-lg">Dados do veículo</CardTitle>
            <CardDescription>Preencha as opções na ordem para localizar a versão correta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-3 gap-2">
              {vehicleOptions.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  type="button"
                  variant={vehicleType === value ? 'default' : 'outline'}
                  onClick={() => setVehicleType(value)}
                  disabled={isBusy}
                  className="h-auto min-h-16 flex-col gap-1.5 sm:flex-row"
                >
                  <Icon className="h-5 w-5" /> {label}
                </Button>
              ))}
            </div>

            {loading === 'initial' ? (
              <div className="flex min-h-48 items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-sky-500" /> Carregando dados atualizados...
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Mês de referência</Label>
                  <Select value={reference} onValueChange={changeReference} disabled={isBusy || references.length === 0}>
                    <SelectTrigger><SelectValue placeholder="Selecione a referência" /></SelectTrigger>
                    <SelectContent>{references.map((item) => <SelectItem key={item.code} value={item.code}>{item.month}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Select value={brandId} onValueChange={changeBrand} disabled={isBusy || brands.length === 0}>
                    <SelectTrigger><SelectValue placeholder={loading === 'brands' ? 'Carregando...' : 'Selecione a marca'} /></SelectTrigger>
                    <SelectContent>{brands.map((item) => <SelectItem key={item.code} value={item.code}>{item.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Modelo</Label>
                  <Select value={modelId} onValueChange={changeModel} disabled={isBusy || !brandId}>
                    <SelectTrigger><SelectValue placeholder={loading === 'models' ? 'Carregando...' : 'Selecione o modelo'} /></SelectTrigger>
                    <SelectContent>{models.map((item) => <SelectItem key={item.code} value={item.code}>{item.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ano e combustível</Label>
                  <Select value={yearId} onValueChange={(value) => { setYearId(value); setResult(null); }} disabled={isBusy || !modelId}>
                    <SelectTrigger><SelectValue placeholder={loading === 'years' ? 'Carregando...' : 'Selecione o ano'} /></SelectTrigger>
                    <SelectContent>{years.map((item) => <SelectItem key={item.code} value={item.code}>{item.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={consult} disabled={isBusy || !yearId} className="h-11 flex-1 gap-2 bg-sky-600 hover:bg-sky-700">
                {loading === 'details' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Consultar valor FIPE
              </Button>
              <Button variant="outline" onClick={() => void loadInitial()} disabled={isBusy} className="h-11 gap-2">
                <RefreshCw className="h-4 w-4" /> Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card className="overflow-hidden border-sky-500/30 shadow-xl">
            <div className="bg-gradient-to-br from-sky-600 to-blue-700 px-6 py-7 text-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm text-white/80"><CheckCircle2 className="h-4 w-4" /> Veículo encontrado</div>
                  <h2 className="text-xl font-bold sm:text-2xl">{result.brand}</h2>
                  <p className="mt-1 max-w-2xl text-sm text-white/85 sm:text-base">{result.model}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={copyResult} className="gap-2"><Copy className="h-4 w-4" /> Copiar</Button>
              </div>
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Valor médio FIPE</p>
                <p className="mt-1 text-4xl font-black tracking-tight sm:text-5xl">{result.price}</p>
              </div>
            </div>
            <CardContent className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
              <ResultItem icon={CalendarDays} label="Ano do modelo" value={String(result.modelYear)} />
              <ResultItem icon={Fuel} label="Combustível" value={result.fuel} />
              <ResultItem icon={Hash} label="Código FIPE" value={result.codeFipe} />
              <ResultItem icon={CalendarDays} label="Referência" value={result.referenceMonth || selectedReference || 'Atual'} />
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          O valor é uma referência média nacional e pode variar conforme região, conservação, quilometragem e opcionais do veículo.
        </p>
      </div>
    </div>
  );
};

const ResultItem = ({ icon: Icon, label, value }: { icon: typeof CarFront; label: string; value: string }) => (
  <div className="rounded-xl border bg-muted/20 p-4">
    <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <Icon className="h-4 w-4 text-sky-500" /> {label}
    </div>
    <p className="font-bold text-foreground">{value}</p>
  </div>
);

export default ConsultaFipe;
