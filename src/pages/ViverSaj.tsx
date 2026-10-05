import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, CarFront, HeartPulse, Lightbulb, Loader2, MapPinned, PackageOpen, SearchCheck, Sparkles, UserRound, UsersRound } from 'lucide-react';
import { DesejosModule } from '@/components/viver-saj/DesejosModule';
import { FeitoSajModule, InovacaoModule, MobilidadeModule, SajAgoraModule } from '@/components/viver-saj/DiscoveryModules';
import { SaudeModule } from '@/components/viver-saj/SaudeModule';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { ViverSajModuleKey } from '@/features/viver-saj/types';
import { useViverSajModules } from '@/hooks/useViverSaj';
import { cn } from '@/lib/utils';

const moduleUi = {
  desejos: { icon: SearchCheck, accent: 'text-violet-600', surface: 'bg-violet-500/10', component: DesejosModule },
  saude: { icon: HeartPulse, accent: 'text-rose-600', surface: 'bg-rose-500/10', component: SaudeModule },
  feito_saj: { icon: PackageOpen, accent: 'text-amber-700', surface: 'bg-amber-500/10', component: FeitoSajModule },
  agora: { icon: CalendarDays, accent: 'text-sky-600', surface: 'bg-sky-500/10', component: SajAgoraModule },
  inovacao: { icon: Lightbulb, accent: 'text-orange-600', surface: 'bg-orange-500/10', component: InovacaoModule },
  mobilidade: { icon: CarFront, accent: 'text-emerald-600', surface: 'bg-emerald-500/10', component: MobilidadeModule },
} satisfies Record<ViverSajModuleKey, { icon: typeof SearchCheck; accent: string; surface: string; component: React.ComponentType }>;

const touristOrder: ViverSajModuleKey[] = ['agora', 'mobilidade', 'saude', 'feito_saj', 'desejos', 'inovacao'];

export default function ViverSaj() {
  const modulesQuery = useViverSajModules();
  const contentRef = useRef<HTMLElement>(null);
  const [params, setParams] = useSearchParams();
  const requested = params.get('area') as ViverSajModuleKey | null;
  const [profile, setProfile] = useState<'morador' | 'visitante'>(() => window.localStorage.getItem('sajtem-city-profile-v1') === 'visitante' ? 'visitante' : 'morador');

  useEffect(() => {
    document.title = 'Viver SAJ | Serviços e oportunidades em Santo Antônio de Jesus';
    const description = 'Pedidos locais, saúde, produtos feitos em SAJ, agenda, inovação e mobilidade reunidos de forma simples no SAJ TEM.';
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    const previous = meta.content;
    meta.content = description;
    return () => { document.title = 'Saj Tem - Santo Antônio de Jesus'; meta!.content = previous; };
  }, []);

  const modules = useMemo(() => {
    const list = modulesQuery.data ?? [];
    if (profile === 'morador') return list;
    return [...list].sort((a, b) => touristOrder.indexOf(a.chave) - touristOrder.indexOf(b.chave));
  }, [modulesQuery.data, profile]);
  const activeKey = modules.some(item => item.chave === requested) ? requested! : modules[0]?.chave;
  const activeModule = modules.find(item => item.chave === activeKey);
  const ActiveContent = activeKey ? moduleUi[activeKey].component : null;

  const changeProfile = (next: 'morador' | 'visitante') => {
    setProfile(next);
    window.localStorage.setItem('sajtem-city-profile-v1', next);
  };

  const selectModule = (key: ViverSajModuleKey) => {
    setParams({ area: key });
    window.requestAnimationFrame(() => contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return <div className="pb-20">
    <section className="border-b bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div><Badge className="mb-4 border-white/20 bg-white/10 text-white"><Sparkles className="mr-1 h-3.5 w-3.5" /> Tudo da cidade, sem bagunça</Badge><h1 className="text-3xl font-black tracking-tight sm:text-5xl">Viver SAJ</h1><p className="mt-3 max-w-2xl text-base leading-7 text-violet-100 sm:text-lg">Serviços úteis, oportunidades e informações locais reunidos em uma única central. Escolha uma área e veja somente o que precisa.</p></div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur"><p className="px-2 pb-2 text-xs font-bold text-violet-100">Personalizar para</p><div className="grid grid-cols-2 gap-2"><Button type="button" size="sm" variant={profile === 'morador' ? 'secondary' : 'ghost'} className={profile !== 'morador' ? 'text-white hover:bg-white/10 hover:text-white' : ''} onClick={() => changeProfile('morador')}><UserRound className="mr-2 h-4 w-4" /> Morador</Button><Button type="button" size="sm" variant={profile === 'visitante' ? 'secondary' : 'ghost'} className={profile !== 'visitante' ? 'text-white hover:bg-white/10 hover:text-white' : ''} onClick={() => changeProfile('visitante')}><MapPinned className="mr-2 h-4 w-4" /> Visitante</Button></div></div>
        </div>
      </div>
    </section>

    <main className="mx-auto max-w-7xl space-y-8 px-4 py-7 sm:px-6 lg:px-8">
      {modulesQuery.isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div> : modules.length === 0 ? <Card><CardContent className="py-14 text-center"><UsersRound className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-3 text-xl font-black">Central em preparação</h2><p className="mt-1 text-sm text-muted-foreground">Os módulos estão sendo organizados pelo administrador.</p></CardContent></Card> : <>
        <div className="-mx-4 md:hidden"><p className="px-4 text-xs font-semibold text-muted-foreground">Toque em uma opção para abrir o conteúdo logo abaixo.</p><nav aria-label="Áreas do Viver SAJ" className="mt-2 flex snap-x gap-2 overflow-x-auto px-4 pb-2">{modules.map(item => { const ui = moduleUi[item.chave]; const Icon = ui.icon; const active = item.chave === activeKey; return <button key={item.chave} type="button" aria-current={active ? 'page' : undefined} onClick={() => selectModule(item.chave)} className={cn('flex min-w-max snap-start items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold transition', active ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'bg-card')}><Icon className="h-4 w-4" />{item.titulo}</button>; })}</nav></div>
        <nav aria-label="Áreas do Viver SAJ" className="hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-3">{modules.map(item => { const ui = moduleUi[item.chave]; const Icon = ui.icon; const active = item.chave === activeKey; return <button key={item.chave} type="button" aria-current={active ? 'page' : undefined} onClick={() => selectModule(item.chave)} className={cn('rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md', active ? 'border-primary bg-primary/5 ring-2 ring-primary/15' : 'bg-card')}><div className="flex items-start gap-3"><div className={cn('rounded-xl p-2.5', ui.surface, ui.accent)}><Icon className="h-5 w-5" /></div><div><h2 className="font-black">{item.titulo}</h2><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.descricao}</p></div></div></button>; })}</nav>
        <section ref={contentRef} aria-labelledby="active-module-title" className="scroll-mt-20 rounded-3xl border bg-card p-4 shadow-sm sm:p-6 md:border-0 md:bg-transparent md:p-0 md:shadow-none"><div className="mb-5"><p className="text-sm font-bold text-primary">Conteúdo selecionado</p><h2 id="active-module-title" className="text-2xl font-black sm:text-3xl">{activeModule?.titulo}</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">{activeModule?.descricao}</p></div>{ActiveContent && <ActiveContent />}</section>
      </>}
    </main>
  </div>;
}
