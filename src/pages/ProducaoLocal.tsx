import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  BarChart3,
  ExternalLink,
  Leaf,
  Loader2,
  MapPin,
  MessageCircle,
  PackageSearch,
  Search,
  ShoppingBasket,
  Sprout,
  Store,
  Tractor,
  Truck,
  Users,
} from 'lucide-react';
import { ProdutorCadastroDialog } from '@/components/producao/ProdutorCadastroDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CULTURAS_PRODUCAO,
  FONTES_PRODUCAO,
  INDICADORES_PRODUCAO,
  PERFIL_AGRICULTURA_FAMILIAR,
  REBANHOS_PRODUCAO,
  formatarMoedaCompacta,
  formatarNumero,
} from '@/features/producao-local/data';
import { useProducaoLocalDisponivel, useProdutoresLocais, useProdutosRurais } from '@/hooks/useProducaoLocal';

const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const whatsappUrl = (phone: string, name: string) => {
  const digits = phone.replace(/\D/g, '');
  const number = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(`Olá! Encontrei ${name} na área de Produção Local do SAJ TEM.`)}`;
};

export default function ProducaoLocal() {
  const [busca, setBusca] = useState('');
  const [culturaSelecionada, setCulturaSelecionada] = useState<string | null>(null);
  const disponibilidade = useProducaoLocalDisponivel();
  const produtoresQuery = useProdutoresLocais();
  const produtosQuery = useProdutosRurais();

  useEffect(() => {
    document.title = 'Produção Local de Santo Antônio de Jesus | Saj Tem';
    const description = 'Dados oficiais da produção rural de Santo Antônio de Jesus e conexão direta com produtores e produtos locais.';
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    const previous = meta.content;
    meta.content = description;
    return () => {
      document.title = 'Saj Tem - Santo Antônio de Jesus';
      if (meta) meta.content = previous;
    };
  }, []);

  const termosAtivos = useMemo(() => {
    const cultura = CULTURAS_PRODUCAO.find(item => item.nome === culturaSelecionada);
    return [busca, ...(cultura?.termos ?? [])].map(normalize).filter(Boolean);
  }, [busca, culturaSelecionada]);

  const produtores = useMemo(() => (produtoresQuery.data ?? []).filter(produtor => {
    if (!termosAtivos.length) return true;
    const text = normalize([produtor.nome_publico, produtor.descricao, produtor.comunidade, ...produtor.produtos, ...produtor.certificacoes].join(' '));
    return termosAtivos.some(term => text.includes(term));
  }), [produtoresQuery.data, termosAtivos]);

  const produtos = useMemo(() => (produtosQuery.data ?? []).filter(produto => {
    if (!termosAtivos.length) return false;
    const text = normalize([produto.nome, produto.descricao, produto.categoria_produto, ...(produto.tags ?? [])].join(' '));
    return termosAtivos.some(term => text.includes(term));
  }).slice(0, 12), [produtosQuery.data, termosAtivos]);

  const selecionarCultura = (nome: string) => {
    setCulturaSelecionada(current => current === nome ? null : nome);
    document.getElementById('onde-comprar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!disponibilidade.data) {
    return <div className="mx-auto max-w-3xl px-4 py-16"><Alert><Sprout className="h-5 w-5" /><AlertTitle>Produção Local em preparação</AlertTitle><AlertDescription>Esta área está temporariamente indisponível enquanto os dados são revisados.</AlertDescription></Alert></div>;
  }

  return (
    <div className="pb-16">
      <section className="border-b bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-800 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.25fr_.75fr] lg:px-8 lg:py-16">
          <div>
            <Badge className="mb-4 border-white/20 bg-white/10 text-white hover:bg-white/15">Dados oficiais + produtores locais</Badge>
            <h1 className="max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">O que Santo Antônio de Jesus produz</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-emerald-50 sm:text-lg">Conheça a força da zona rural, encontre quem produz e descubra onde comprar produtos da nossa terra.</p>
            <div className="mt-7 flex flex-wrap gap-3"><ProdutorCadastroDialog /><Button asChild size="lg" variant="outline" className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white hover:text-emerald-950"><a href="#onde-comprar"><ShoppingBasket className="mr-2 h-5 w-5" /> Onde comprar</a></Button></div>
          </div>
          <div className="grid grid-cols-2 gap-3 self-end">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur"><Leaf className="mb-5 h-7 w-7 text-lime-300" /><p className="text-3xl font-black">74%</p><p className="mt-1 text-sm text-emerald-100">dos estabelecimentos são da agricultura familiar</p></div>
            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur"><Tractor className="mb-5 h-7 w-7 text-amber-300" /><p className="text-3xl font-black">R$ 27,2 mi</p><p className="mt-1 text-sm text-emerald-100">em valor de produção agrícola</p></div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        <section aria-labelledby="resumo-producao">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="font-semibold text-emerald-700 dark:text-emerald-400">Panorama municipal</p><h2 id="resumo-producao" className="text-2xl font-black sm:text-3xl">Produção em números</h2></div><p className="text-xs text-muted-foreground">Cada indicador informa sua fonte e ano de referência.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{INDICADORES_PRODUCAO.map(item => <Card key={item.rotulo} className="overflow-hidden border-emerald-900/10"><CardContent className="p-5"><p className="text-sm font-medium text-muted-foreground">{item.rotulo}</p><p className="mt-1 text-3xl font-black text-emerald-800 dark:text-emerald-300">{item.valor}</p><p className="mt-1 text-sm">{item.detalhe}</p><Badge variant="outline" className="mt-4 text-[11px]">{item.fonte}</Badge></CardContent></Card>)}</div>
        </section>

        <Tabs defaultValue="lavouras" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-3"><TabsTrigger value="lavouras" className="py-3">Lavouras</TabsTrigger><TabsTrigger value="rebanhos" className="py-3">Rebanhos</TabsTrigger><TabsTrigger value="familiar" className="py-3">Agricultura familiar</TabsTrigger></TabsList>
          <TabsContent value="lavouras" className="space-y-4"><div><h2 className="text-2xl font-black">Principais culturas</h2><p className="text-sm text-muted-foreground">Toque em uma cultura para encontrar produtores e produtos relacionados.</p></div><div className="grid gap-3 md:grid-cols-2">{CULTURAS_PRODUCAO.map(cultura => <button key={cultura.nome} type="button" onClick={() => selecionarCultura(cultura.nome)} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-600 hover:shadow-md ${culturaSelecionada === cultura.nome ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20 dark:bg-emerald-950/30' : 'bg-card'}`}><div className="flex items-start justify-between gap-4"><div><h3 className="font-black">{cultura.nome}</h3><p className="mt-1 text-xs text-muted-foreground">{formatarNumero(cultura.areaHectares)} ha · {formatarNumero(cultura.quantidadeToneladas)} t</p></div><p className="font-black text-emerald-700 dark:text-emerald-400">{formatarMoedaCompacta(cultura.valorReais)}</p></div><Progress value={cultura.participacao} className="mt-4 h-2" /><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{String(cultura.participacao).replace('.', ',')}% do valor</span><span className="font-semibold text-emerald-700 dark:text-emerald-400">Ver onde comprar</span></div></button>)}</div><p className="text-xs text-muted-foreground">Fonte: IBGE, Produção Agrícola Municipal 2025. Valores arredondados.</p></TabsContent>
          <TabsContent value="rebanhos" className="space-y-4"><div><h2 className="text-2xl font-black">Rebanhos do município</h2><p className="text-sm text-muted-foreground">Quantidade registrada pela Pesquisa da Pecuária Municipal.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{REBANHOS_PRODUCAO.map(item => <Card key={item.nome}><CardContent className="p-5"><p className="text-sm text-muted-foreground">{item.nome}</p><p className="mt-2 text-2xl font-black">{formatarNumero(item.quantidade)}</p><p className="text-xs text-muted-foreground">{item.unidade}</p></CardContent></Card>)}</div><div className="grid gap-4 md:grid-cols-3"><Card><CardHeader><CardTitle>Leite</CardTitle><CardDescription>494 mil litros/ano</CardDescription></CardHeader><CardContent className="text-2xl font-black text-emerald-700">R$ 988 mil</CardContent></Card><Card><CardHeader><CardTitle>Ovos de galinha</CardTitle><CardDescription>104 mil dúzias/ano</CardDescription></CardHeader><CardContent className="text-2xl font-black text-emerald-700">R$ 582 mil</CardContent></Card><Card><CardHeader><CardTitle>Mel</CardTitle><CardDescription>290 kg/ano</CardDescription></CardHeader><CardContent className="text-2xl font-black text-emerald-700">R$ 3 mil</CardContent></Card></div><p className="text-xs text-muted-foreground">Fonte: IBGE, Pesquisa da Pecuária Municipal 2024.</p></TabsContent>
          <TabsContent value="familiar" className="space-y-5"><div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><Card className="border-emerald-800/20 bg-emerald-950 text-white"><CardContent className="p-7"><Users className="h-8 w-8 text-lime-300" /><p className="mt-8 text-5xl font-black">1.996</p><p className="mt-2 text-emerald-100">estabelecimentos de agricultura familiar entre 2.715 estabelecimentos rurais.</p><Badge className="mt-5 bg-white/10 text-white">Censo Agro 2017</Badge></CardContent></Card><div className="space-y-3">{PERFIL_AGRICULTURA_FAMILIAR.map(item => <div key={item.atividade} className="rounded-2xl border bg-card p-4"><div className="flex justify-between gap-4"><span className="font-semibold">{item.atividade}</span><strong>{formatarNumero(item.estabelecimentos)}</strong></div><Progress value={(item.estabelecimentos / 996) * 100} className="mt-3 h-2" /></div>)}</div></div><Alert><BarChart3 className="h-4 w-4" /><AlertTitle>Atenção ao ano de referência</AlertTitle><AlertDescription>Os números estruturais da agricultura familiar são do Censo Agropecuário 2017 e não devem ser interpretados como uma contagem atual.</AlertDescription></Alert></TabsContent>
        </Tabs>

        <section id="onde-comprar" className="scroll-mt-24 space-y-6">
          <div className="rounded-3xl border bg-muted/40 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-semibold text-emerald-700 dark:text-emerald-400">Da roça para a cidade</p><h2 className="text-2xl font-black sm:text-3xl">Quem produz e onde comprar</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Pesquise por produto ou selecione uma cultura acima. O SAJ TEM mostra somente resultados relacionados à sua escolha.</p></div><ProdutorCadastroDialog /></div><div className="relative mt-5"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /><Input value={busca} onChange={e => setBusca(e.target.value)} className="h-12 rounded-full bg-background pl-12" placeholder="Ex.: mandioca, laranja, mel, farinha..." /></div>{culturaSelecionada && <div className="mt-4 flex items-center gap-2"><Badge className="bg-emerald-700">{culturaSelecionada}</Badge><button type="button" onClick={() => setCulturaSelecionada(null)} className="text-xs underline">limpar filtro</button></div>}</div>

          {produtoresQuery.isLoading ? <Loader2 className="mx-auto h-7 w-7 animate-spin" /> : produtores.length > 0 ? <div><h3 className="mb-4 flex items-center gap-2 text-xl font-black"><Tractor className="h-5 w-5 text-emerald-700" /> Produtores cadastrados</h3><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{produtores.map(produtor => <Card key={produtor.id}><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>{produtor.nome_publico}</CardTitle><CardDescription className="mt-1 capitalize">{produtor.tipo.replace(/_/g, ' ')}</CardDescription></div>{produtor.certificacoes.length > 0 && <BadgeCheck className="h-5 w-5 text-emerald-600" />}</div></CardHeader><CardContent className="space-y-4"><p className="line-clamp-3 text-sm text-muted-foreground">{produtor.descricao || 'Produtor local cadastrado no SAJ TEM.'}</p>{produtor.comunidade && <p className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-emerald-700" />{produtor.comunidade}</p>}<div className="flex flex-wrap gap-1.5">{produtor.produtos.map(produto => <Badge key={produto} variant="secondary">{produto}</Badge>)}</div><div className="flex flex-wrap gap-2 text-xs text-muted-foreground">{produtor.varejo && <span>Varejo</span>}{produtor.atacado && <span>Atacado</span>}{produtor.entrega && <span className="flex items-center gap-1"><Truck className="h-3 w-3" />Entrega</span>}</div>{produtor.telefone_whatsapp && <Button asChild className="w-full bg-emerald-700 hover:bg-emerald-800"><a href={whatsappUrl(produtor.telefone_whatsapp, produtor.nome_publico)} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-4 w-4" /> Falar no WhatsApp</a></Button>}</CardContent></Card>)}</div></div> : termosAtivos.length > 0 && <Alert><PackageSearch className="h-4 w-4" /><AlertTitle>Nenhum produtor relacionado foi encontrado</AlertTitle><AlertDescription>O cadastro de produtores está começando. Você ainda pode verificar produtos de empresas locais abaixo.</AlertDescription></Alert>}

          {produtos.length > 0 && <div><h3 className="mb-4 flex items-center gap-2 text-xl font-black"><Store className="h-5 w-5 text-emerald-700" /> Produtos encontrados no SAJ TEM</h3><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{produtos.map(produto => { const empresa = Array.isArray(produto.empresas) ? produto.empresas[0] : produto.empresas; return <Card key={produto.id} className="overflow-hidden"><div className="aspect-[4/3] bg-muted">{produto.imagem_principal_url ? <img src={produto.imagem_principal_url} alt={produto.nome} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center"><ShoppingBasket className="h-10 w-10 text-muted-foreground/40" /></div>}</div><CardContent className="p-4"><p className="font-black">{produto.nome}</p><p className="mt-1 text-xs text-muted-foreground">{empresa?.nome || 'Empresa local'}</p><div className="mt-4 flex gap-2">{empresa?.slug && <Button asChild size="sm" variant="outline" className="flex-1"><Link to={`/locais/${empresa.slug}`}>Ver local</Link></Button>}{produto.link_whatsapp && <Button asChild size="sm" className="bg-emerald-700 hover:bg-emerald-800"><a href={produto.link_whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /></a></Button>}</div></CardContent></Card>; })}</div></div>}

          {!termosAtivos.length && produtores.length === 0 && <div className="rounded-3xl border border-dashed p-10 text-center"><Sprout className="mx-auto h-10 w-10 text-emerald-600" /><h3 className="mt-3 font-black">O catálogo rural está começando</h3><p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">Produtores, associações e cooperativas podem enviar gratuitamente seus dados para análise.</p><div className="mt-5"><ProdutorCadastroDialog /></div></div>}
        </section>

        <section className="space-y-5"><div><p className="font-semibold text-emerald-700 dark:text-emerald-400">Transparência</p><h2 className="text-2xl font-black">Fontes oficiais</h2><p className="mt-1 text-sm text-muted-foreground">O SAJ TEM não altera a metodologia das fontes e informa o ano de referência de cada dado.</p></div><div className="grid gap-3 md:grid-cols-2">{FONTES_PRODUCAO.map(fonte => <a key={fonte.nome} href={fonte.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-4 transition hover:border-emerald-600"><div><p className="font-bold">{fonte.nome}</p><p className="text-xs text-muted-foreground">{fonte.orgao} · referência {fonte.ano}</p></div><ExternalLink className="h-4 w-4 shrink-0" /></a>)}</div><p className="text-xs leading-5 text-muted-foreground">Os registros de produtores publicados pelo SAJ TEM são autodeclarados e passam por moderação. Selos e certificações dependem de verificação documental. Endereços residenciais exatos não são exibidos.</p></section>
      </main>
    </div>
  );
}
