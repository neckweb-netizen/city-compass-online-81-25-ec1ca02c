import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, ShoppingBasket, Tractor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProducaoLocalDisponivel } from '@/hooks/useProducaoLocal';

export function LocalProductionHomeEntry() {
  const { data: enabled } = useProducaoLocalDisponivel();
  if (!enabled) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-5 lg:px-8" aria-labelledby="producao-local-home">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-700 p-6 text-white shadow-lg sm:p-8">
        <Leaf className="absolute -right-8 -top-8 h-40 w-40 rotate-12 text-white/5" aria-hidden="true" />
        <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_auto]">
          <div><div className="mb-3 flex items-center gap-2 text-sm font-bold text-lime-300"><Tractor className="h-5 w-5" /> Produção Local</div><h2 id="producao-local-home" className="text-2xl font-black sm:text-3xl">Da nossa terra para a sua mesa</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50 sm:text-base">Veja o que Santo Antônio de Jesus produz, encontre produtores e descubra onde comprar.</p></div>
          <Button asChild size="lg" className="w-full rounded-full bg-white text-emerald-950 hover:bg-emerald-50 lg:w-auto"><Link to="/producao-local"><ShoppingBasket className="mr-2 h-5 w-5" /> Explorar produção <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </div>
    </section>
  );
}
