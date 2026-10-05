import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Clock3, ExternalLink, HeartPulse, Loader2, MapPin, Phone, Search, ShieldPlus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useHealthBusinesses, useHealthServices } from '@/hooks/useViverSaj';

const labels: Record<string, string> = { upa: 'UPA', hospital: 'Hospital', ubs: 'UBS/Posto', caps: 'CAPS', farmacia_publica: 'Farmácia pública', hemocentro: 'Hemocentro', laboratorio: 'Laboratório', clinica: 'Clínica', farmacia: 'Farmácia', outro: 'Outro' };

export function SaudeModule() {
  const servicesQuery = useHealthServices();
  const businessesQuery = useHealthBusinesses();
  const [search, setSearch] = useState('');
  const [only24h, setOnly24h] = useState(false);
  const services = useMemo(() => (servicesQuery.data ?? []).filter(item => {
    const term = search.toLowerCase().trim();
    const matches = !term || [item.nome, item.tipo, item.bairro, item.endereco, ...item.servicos].join(' ').toLowerCase().includes(term);
    return matches && (!only24h || item.atendimento_24h);
  }), [servicesQuery.data, search, only24h]);
  const businesses = useMemo(() => (businessesQuery.data ?? []).filter(item => {
    if (only24h) return false;
    const term = search.toLowerCase().trim();
    return !term || [item.nome, item.descricao, item.endereco, item.categoria].join(' ').toLowerCase().includes(term);
  }), [businessesQuery.data, search, only24h]);
  const loading = servicesQuery.isLoading || businessesQuery.isLoading;

  return <div className="space-y-5">
    <Alert className="border-rose-500/25 bg-rose-500/5"><HeartPulse className="h-5 w-5 text-rose-600" /><AlertTitle>Em emergência, ligue 192</AlertTitle><AlertDescription>Os dados ajudam a localizar serviços, mas não substituem orientação médica. Confirme horários antes de sair quando não for urgência.</AlertDescription></Alert>
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} className="pl-9" placeholder="Buscar hospital, clínica, farmácia, bairro ou serviço" /></div><Button variant={only24h ? 'default' : 'outline'} onClick={() => setOnly24h(value => !value)}><Clock3 className="mr-2 h-4 w-4" /> 24 horas</Button></div>
    {loading ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : services.length === 0 && businesses.length === 0 ? <Card><CardContent className="py-12 text-center"><ShieldPlus className="mx-auto h-9 w-9 text-muted-foreground" /><p className="mt-3 font-bold">Nenhum serviço encontrado com esses filtros.</p></CardContent></Card> : <>
      {services.length > 0 && <section><h3 className="mb-3 text-lg font-black">Serviços essenciais verificados</h3><div className="grid gap-4 md:grid-cols-2">{services.map(item => <Card key={item.id} className={item.atendimento_24h ? 'border-rose-500/25' : ''}><CardHeader><div className="flex flex-wrap items-start justify-between gap-2"><div><Badge variant="outline">{labels[item.tipo] ?? item.tipo}</Badge><CardTitle className="mt-2 text-lg">{item.nome}</CardTitle></div>{item.atendimento_24h && <Badge className="bg-rose-600">24 horas</Badge>}</div></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{item.descricao}</p>{item.atendimento_sus && <Badge className="bg-emerald-600">Atende SUS</Badge>}{item.endereco && <p className="flex gap-2 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{item.endereco}{item.bairro ? ` · ${item.bairro}` : ''}</p>}{item.horario && <p className="flex gap-2 text-sm"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" />{item.horario}</p>}<div className="flex flex-wrap gap-1.5">{item.servicos.map(service => <Badge key={service} variant="secondary">{service}</Badge>)}</div><div className="flex flex-wrap gap-2">{item.telefone && <Button asChild size="sm"><a href={`tel:${item.telefone.replace(/[^\d+]/g, '')}`}><Phone className="mr-2 h-4 w-4" /> Ligar</a></Button>}{item.endereco && <Button asChild size="sm" variant="outline"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.nome}, ${item.endereco}, Santo Antônio de Jesus BA`)}`} target="_blank" rel="noopener noreferrer"><MapPin className="mr-2 h-4 w-4" /> Mapa</a></Button>}{item.fonte_url && <Button asChild size="sm" variant="ghost"><a href={item.fonte_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Fonte</a></Button>}</div>{item.fonte_nome && <p className="text-[11px] text-muted-foreground">Fonte: {item.fonte_nome}{item.verificado_em ? ` · referência ${new Date(`${item.verificado_em}T12:00:00`).toLocaleDateString('pt-BR')}` : ''}</p>}</CardContent></Card>)}</div></section>}
      {businesses.length > 0 && <section><div className="mb-3"><h3 className="text-lg font-black">Empresas de saúde cadastradas</h3><p className="text-xs text-muted-foreground">Clínicas, farmácias e outros negócios ativos são puxados automaticamente do catálogo do SAJ TEM.</p></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{businesses.map(item => <Card key={item.id}><CardHeader><div className="flex items-start justify-between gap-2"><div><Badge variant="outline">{item.categoria || 'Saúde'}</Badge><CardTitle className="mt-2 text-lg">{item.nome}</CardTitle></div>{item.verificado && <Badge>Verificada</Badge>}</div></CardHeader><CardContent className="space-y-3"><p className="line-clamp-3 text-sm text-muted-foreground">{item.descricao || 'Empresa de saúde cadastrada no SAJ TEM.'}</p>{item.endereco && <p className="flex gap-2 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{item.endereco}</p>}<div className="flex gap-2"><Button asChild size="sm" variant="outline" className="flex-1"><Link to={`/locais/${item.slug}`}><Building2 className="mr-2 h-4 w-4" /> Ver perfil</Link></Button>{item.telefone && <Button asChild size="icon"><a href={`tel:${item.telefone.replace(/[^\d+]/g, '')}`} aria-label={`Ligar para ${item.nome}`}><Phone className="h-4 w-4" /></a></Button>}</div></CardContent></Card>)}</div></section>}
    </>}
  </div>;
}
