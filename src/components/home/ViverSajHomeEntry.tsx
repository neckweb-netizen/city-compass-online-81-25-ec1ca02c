import { CalendarDays, HeartPulse, Landmark, PackageOpen, SearchCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const chips = [{ icon: SearchCheck, label: 'Estou procurando' }, { icon: HeartPulse, label: 'Saúde' }, { icon: PackageOpen, label: 'Feito em SAJ' }, { icon: CalendarDays, label: 'Agora' }];

export function ViverSajHomeEntry() {
  return <section className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-5 lg:px-8" aria-labelledby="viver-saj-home"><div className="overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-900 p-5 text-white shadow-lg sm:p-7"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center"><div><p className="flex items-center gap-2 text-sm font-bold text-violet-200"><Landmark className="h-5 w-5" /> Viver SAJ</p><h2 id="viver-saj-home" className="mt-2 text-2xl font-black sm:text-3xl">O que você precisa na cidade?</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-violet-100">Pedidos, saúde, agenda e produção local em uma central organizada. Sem listas aleatórias.</p><div className="mt-4 flex flex-wrap gap-2">{chips.map(({ icon: Icon, label }) => <span key={label} className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs"><Icon className="h-3.5 w-3.5" />{label}</span>)}</div></div><Button asChild size="lg" className="w-full rounded-full bg-white text-violet-950 hover:bg-violet-50 lg:w-auto"><Link to="/viver-saj"><Landmark className="mr-2 h-5 w-5" /> Abrir central</Link></Button></div></div></section>;
}
