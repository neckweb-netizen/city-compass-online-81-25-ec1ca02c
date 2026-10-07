import { useMemo, useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Instagram, Loader2, MapPin, MessageCircle, Minus, Plus, Search, Share2, ShoppingBag, Sparkles, Store, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import { ToolBanner } from '@/components/ferramentas/ToolBanner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { CardapioItem } from '@/features/cardapio/types';
import { normalizeWhatsApp } from '@/features/cardapio/types';
import { usePublicCardapio } from '@/hooks/useCardapioDigital';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CardapioPublico() {
  const { slug } = useParams();
  const query = usePublicCardapio(slug);
  const cardapio = query.data;
  const [category, setCategory] = useState('Todos');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});

  const items = useMemo(() => cardapio?.cardapio_itens ?? [], [cardapio?.cardapio_itens]);
  const categories = useMemo(() => ['Todos', ...Array.from(new Set(items.map(item => item.categoria)))], [items]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(item => (category === 'Todos' || item.categoria === category) && (!term || [item.nome, item.descricao, item.categoria].join(' ').toLowerCase().includes(term)))
      .sort((a, b) => Number(b.destaque) - Number(a.destaque) || a.ordem - b.ordem);
  }, [category, items, search]);
  const cartItems = useMemo(() => items.filter(item => (cart[item.id] ?? 0) > 0), [cart, items]);
  const totalItems = cartItems.reduce((sum, item) => sum + cart[item.id], 0);
  const total = cartItems.reduce((sum, item) => sum + Number(item.preco) * cart[item.id], 0);

  const updateCart = (item: CardapioItem, delta: number) => setCart(current => {
    const quantity = Math.max(0, (current[item.id] ?? 0) + delta);
    if (quantity === 0) {
      const next = { ...current };
      delete next[item.id];
      return next;
    }
    return { ...current, [item.id]: quantity };
  });

  const orderUrl = useMemo(() => {
    if (!cardapio?.whatsapp || cartItems.length === 0) return '';
    const lines = cartItems.map(item => `${cart[item.id]}x ${item.nome} — ${money.format(Number(item.preco) * cart[item.id])}`);
    const message = [`Olá, ${cardapio.nome}! Gostaria de fazer este pedido:`, '', ...lines, '', `Total estimado: ${money.format(total)}`, '', `Cardápio: ${window.location.href}`].join('\n');
    return `https://wa.me/${normalizeWhatsApp(cardapio.whatsapp)}?text=${encodeURIComponent(message)}`;
  }, [cardapio, cart, cartItems, total]);

  const share = async () => {
    const data = { title: cardapio?.nome ?? 'Cardápio digital', text: `Veja o cardápio de ${cardapio?.nome}.`, url: window.location.href };
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado.');
    }
  };

  if (query.isLoading) return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-primary" /></div>;
  if (query.isError || !cardapio) return <div className="flex min-h-[70vh] items-center justify-center px-4"><Card className="max-w-md"><CardContent className="py-12 text-center"><Store className="mx-auto h-12 w-12 text-muted-foreground" /><h1 className="mt-4 text-2xl font-black">Cardápio indisponível</h1><p className="mt-2 text-sm text-muted-foreground">O link pode estar incorreto ou o estabelecimento pausou a publicação.</p><Button asChild className="mt-5"><Link to="/ferramentas"><ChevronLeft className="mr-2 h-4 w-4" />Voltar ao SAJ TEM</Link></Button></CardContent></Card></div>;

  return <div className="min-h-screen bg-[#faf9fc] pb-36 dark:bg-background" style={{ '--menu-color': cardapio.cor_primaria } as CSSProperties}>
    <section className="relative overflow-hidden bg-slate-950 text-white">
      {cardapio.capa_url ? <img src={cardapio.capa_url} alt={`Capa de ${cardapio.nome}`} className="absolute inset-0 h-full w-full object-cover opacity-45" /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--menu-color),transparent_55%)] opacity-80" />}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-transparent" />
      <div className="relative mx-auto flex min-h-[330px] max-w-6xl flex-col justify-end px-4 pb-8 pt-10 sm:px-6 lg:px-8">
        <div className="flex items-end gap-4">{cardapio.logo_url ? <img src={cardapio.logo_url} alt={`Logo de ${cardapio.nome}`} className="h-24 w-24 rounded-3xl border-4 border-white/20 bg-white object-cover shadow-2xl sm:h-28 sm:w-28" /> : <div className="grid h-24 w-24 place-items-center rounded-3xl border-4 border-white/20 bg-white/10 shadow-2xl backdrop-blur sm:h-28 sm:w-28"><UtensilsCrossed className="h-10 w-10" /></div>}<div className="min-w-0 flex-1"><Badge className="mb-2 bg-white/15 text-white backdrop-blur">Cardápio Digital</Badge><h1 className="text-3xl font-black leading-tight sm:text-5xl">{cardapio.nome}</h1><p className="mt-2 max-w-2xl text-sm text-slate-200 sm:text-base">{cardapio.descricao || 'Confira nossas opções e faça seu pedido.'}</p></div><Button type="button" size="icon" variant="outline" onClick={() => void share()} className="shrink-0 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white" aria-label="Compartilhar cardápio"><Share2 className="h-5 w-5" /></Button></div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-200">{cardapio.endereco && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cardapio.endereco)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 backdrop-blur"><MapPin className="h-3.5 w-3.5" />{cardapio.endereco}</a>}{cardapio.instagram && <a href={`https://instagram.com/${cardapio.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-2 backdrop-blur"><Instagram className="h-3.5 w-3.5" />@{cardapio.instagram.replace(/^@/, '')}</a>}</div>
      </div>
    </section>

    <main className="mx-auto max-w-6xl space-y-7 px-4 py-7 sm:px-6 lg:px-8">
      <ToolBanner secao="cardapio_digital" className="my-0" />
      <div className="sticky top-[57px] z-30 -mx-4 space-y-3 border-y bg-background/95 px-4 py-3 shadow-sm backdrop-blur lg:top-[73px] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} className="h-11 rounded-xl bg-muted/60 pl-9" placeholder="Buscar no cardápio" /></div><nav aria-label="Categorias do cardápio" className="flex gap-2 overflow-x-auto pb-1">{categories.map(item => <button type="button" key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${category === item ? 'border-transparent text-white shadow-md' : 'bg-card text-foreground'}`} style={category === item ? { backgroundColor: cardapio.cor_primaria } : undefined}>{item}</button>)}</nav></div>

      {filtered.length === 0 ? <Card><CardContent className="py-16 text-center"><UtensilsCrossed className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-3 font-black">Nenhum item encontrado</h2><p className="mt-1 text-sm text-muted-foreground">Tente outra categoria ou busca.</p></CardContent></Card> : <div className="grid gap-4 md:grid-cols-2">{filtered.map(item => <Card key={item.id} className="group overflow-hidden rounded-3xl border-0 shadow-md transition hover:-translate-y-0.5 hover:shadow-xl"><CardContent className="flex h-full gap-4 p-3 sm:p-4">{item.imagem_url ? <img src={item.imagem_url} alt={item.nome} loading="lazy" className="h-28 w-28 shrink-0 rounded-2xl object-cover sm:h-36 sm:w-36" /> : <div className="grid h-28 w-28 shrink-0 place-items-center rounded-2xl bg-muted sm:h-36 sm:w-36"><UtensilsCrossed className="h-8 w-8 text-muted-foreground/50" /></div>}<div className="flex min-w-0 flex-1 flex-col">{item.destaque && <Badge className="mb-2 w-fit" style={{ backgroundColor: cardapio.cor_primaria }}><Sparkles className="mr-1 h-3 w-3" />Destaque</Badge>}<h2 className="text-lg font-black leading-tight">{item.nome}</h2><p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">{item.descricao || item.categoria}</p><div className="mt-auto flex items-end justify-between gap-2 pt-3"><p className="text-xl font-black" style={{ color: cardapio.cor_primaria }}>{money.format(Number(item.preco))}</p>{cardapio.aceita_pedidos && cardapio.whatsapp && ((cart[item.id] ?? 0) > 0 ? <div className="flex items-center rounded-full border bg-background shadow-sm"><Button type="button" size="icon" variant="ghost" className="h-9 w-9 rounded-full" onClick={() => updateCart(item, -1)} aria-label={`Remover ${item.nome}`}><Minus className="h-4 w-4" /></Button><span className="w-7 text-center text-sm font-black">{cart[item.id]}</span><Button type="button" size="icon" className="h-9 w-9 rounded-full" onClick={() => updateCart(item, 1)} aria-label={`Adicionar mais ${item.nome}`} style={{ backgroundColor: cardapio.cor_primaria }}><Plus className="h-4 w-4" /></Button></div> : <Button type="button" size="sm" className="rounded-full" onClick={() => updateCart(item, 1)} style={{ backgroundColor: cardapio.cor_primaria }}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>)}</div></div></CardContent></Card>)}</div>}
    </main>

    {totalItems > 0 && orderUrl && <div className="fixed bottom-20 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 rounded-2xl border bg-background/95 p-3 shadow-2xl backdrop-blur lg:bottom-24"><div className="flex items-center gap-3"><div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white" style={{ backgroundColor: cardapio.cor_primaria }}><ShoppingBag className="h-5 w-5" /><span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-black">{totalItems}</span></div><div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">Total estimado</p><p className="font-black">{money.format(total)}</p></div><Button asChild className="rounded-xl bg-emerald-600 hover:bg-emerald-700"><a href={orderUrl} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-4 w-4" />Pedir</a></Button></div></div>}
  </div>;
}
