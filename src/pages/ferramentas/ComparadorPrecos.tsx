import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BadgeDollarSign, CheckCircle2, Scale, ShoppingBasket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToolBanner } from '@/components/ferramentas/ToolBanner';

type Product = { name: string; price: string; quantity: string };
const initialProducts: Product[] = [{ name: 'Produto A', price: '', quantity: '' }, { name: 'Produto B', price: '', quantity: '' }, { name: 'Produto C', price: '', quantity: '' }];
const numberFrom = (value: string) => Number(value.replace(',', '.')) || 0;
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 4 });

export default function ComparadorPrecos() {
  const navigate = useNavigate();
  const [products, setProducts] = useState(initialProducts);
  const [unit, setUnit] = useState('g');

  const results = useMemo(() => products.map((product, index) => {
    const price = numberFrom(product.price);
    const quantity = numberFrom(product.quantity);
    return { ...product, index, unitPrice: quantity > 0 ? price / quantity : 0, valid: price > 0 && quantity > 0 };
  }), [products]);
  const validResults = results.filter(item => item.valid);
  const bestPrice = validResults.length > 1 ? Math.min(...validResults.map(item => item.unitPrice)) : 0;

  const updateProduct = (index: number, field: keyof Product, value: string) => {
    setProducts(current => current.map((product, productIndex) => productIndex === index ? { ...product, [field]: value } : product));
  };

  return <div className="min-h-screen bg-muted/20 px-3 pb-24 pt-4 sm:px-6 sm:py-8">
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><Button variant="ghost" onClick={() => navigate('/ferramentas')}><ArrowLeft className="mr-2 h-4 w-4" />Ferramentas</Button><Badge variant="outline"><ShoppingBasket className="mr-1 h-3.5 w-3.5" />Economia no mercado</Badge></div>
      <header className="space-y-2 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-500/15 text-teal-600"><Scale className="h-7 w-7" /></div><h1 className="text-3xl font-black sm:text-4xl">Comparador de preços</h1><p className="mx-auto max-w-2xl text-sm text-muted-foreground">Compare embalagens de tamanhos diferentes e descubra qual produto realmente custa menos por unidade.</p></header>
      <ToolBanner secao="ferramentas" />

      <Card><CardHeader><div className="flex flex-wrap items-end justify-between gap-3"><div><CardTitle>Informe até três produtos</CardTitle><p className="mt-1 text-sm text-muted-foreground">Use a mesma unidade de medida em todos.</p></div><div className="w-40 space-y-1"><Label>Unidade</Label><Select value={unit} onValueChange={setUnit}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="g">gramas (g)</SelectItem><SelectItem value="kg">quilos (kg)</SelectItem><SelectItem value="ml">mililitros (ml)</SelectItem><SelectItem value="l">litros (l)</SelectItem><SelectItem value="un.">unidades</SelectItem><SelectItem value="m">metros (m)</SelectItem></SelectContent></Select></div></div></CardHeader><CardContent>
        <div className="grid gap-4 md:grid-cols-3">{products.map((product, index) => {
          const result = results[index];
          const isBest = result.valid && bestPrice > 0 && result.unitPrice === bestPrice;
          return <div key={index} className={`rounded-2xl border p-4 transition ${isBest ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/15' : 'bg-card'}`}>
            <div className="mb-3 flex items-center justify-between gap-2"><Badge variant="secondary">Opção {index + 1}</Badge>{isBest && <Badge className="bg-emerald-600"><CheckCircle2 className="mr-1 h-3 w-3" />Melhor preço</Badge>}</div>
            <div className="space-y-3"><div className="space-y-1"><Label htmlFor={`name-${index}`}>Nome</Label><Input id={`name-${index}`} value={product.name} onChange={event => updateProduct(index, 'name', event.target.value)} /></div><div className="space-y-1"><Label htmlFor={`price-${index}`}>Preço total</Label><Input id={`price-${index}`} inputMode="decimal" value={product.price} onChange={event => updateProduct(index, 'price', event.target.value)} placeholder="Ex.: 12,90" /></div><div className="space-y-1"><Label htmlFor={`quantity-${index}`}>Quantidade ({unit})</Label><Input id={`quantity-${index}`} inputMode="decimal" value={product.quantity} onChange={event => updateProduct(index, 'quantity', event.target.value)} placeholder="Ex.: 500" /></div></div>
            <div className="mt-4 rounded-xl bg-muted p-3 text-center"><p className="text-xs text-muted-foreground">Preço por {unit}</p><p className="text-xl font-black">{result.valid ? currency.format(result.unitPrice) : '—'}</p></div>
          </div>;
        })}</div>
        {validResults.length < 2 && <div className="mt-5 rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground"><BadgeDollarSign className="mx-auto mb-2 h-6 w-6" />Preencha pelo menos duas opções para identificar o melhor preço.</div>}
        {validResults.length > 1 && <div className="mt-5 rounded-2xl bg-emerald-500/10 p-5 text-center"><p className="text-sm text-muted-foreground">A opção mais econômica é</p><p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-400">{validResults.find(item => item.unitPrice === bestPrice)?.name || 'menor preço'}</p><p className="text-sm">{currency.format(bestPrice)} por {unit}</p></div>}
      </CardContent></Card>
    </div>
  </div>;
}
