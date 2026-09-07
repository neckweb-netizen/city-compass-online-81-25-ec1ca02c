import { Award, Clock3, Copy, Gift, History, Loader2, ShieldCheck, Sparkles, Stamp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LoyaltyQRCode } from '@/components/loyalty/LoyaltyQRCode';
import { MyLoyaltyCard, useLoyaltyTransactions, useMyLoyaltyCards } from '@/hooks/useLoyalty';

const CardHistory = ({ cardId }: { cardId: string }) => {
  const { data = [], isLoading } = useLoyaltyTransactions(cardId);
  if (isLoading) return <Loader2 className="mx-auto my-5 h-5 w-5 animate-spin" />;
  if (!data.length) return <p className="py-5 text-center text-xs text-muted-foreground">Seu histórico aparecerá aqui.</p>;
  return <div className="divide-y divide-white/10">
    {data.slice(0, 8).map((item: any) => <div key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
      <div className="flex items-center gap-2">{item.tipo === 'resgate' ? <Award className="h-4 w-4 text-amber-300" /> : <Stamp className="h-4 w-4 text-emerald-300" />}<div><p>{item.tipo === 'resgate' ? 'Recompensa resgatada' : item.tipo === 'bonus' ? 'Bônus de boas-vindas' : 'Carimbo recebido'}</p><p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString('pt-BR')}</p></div></div>
      <span className={item.quantidade > 0 ? 'text-emerald-300' : 'text-amber-300'}>{item.quantidade > 0 ? '+' : ''}{item.quantidade}</span>
    </div>)}
  </div>;
};

const DigitalCard = ({ card }: { card: MyLoyaltyCard }) => {
  const program = card.loyalty_programs;
  const company = program.empresas;
  const percent = Math.min(100, Math.round(card.saldo / program.carimbos_necessarios * 100));
  const expiresAt = program.validade_dias ? new Date(new Date(card.created_at).getTime() + program.validade_dias * 86400000) : null;
  return <Card className="overflow-hidden border-white/10 bg-[#171121]">
    <div className="relative p-5 text-white sm:p-7" style={{ background: `linear-gradient(135deg, ${program.cor_principal}, #171022 75%)` }}>
      <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-white/65">{company.nome}</p><h2 className="mt-1 text-2xl font-bold">{program.nome}</h2></div><Gift className="h-8 w-8 text-white/85" /></div>
      <div className="relative mt-6 grid grid-cols-5 gap-2 sm:grid-cols-10">
        {Array.from({ length: program.carimbos_necessarios }, (_, index) => <div key={index} className={`grid aspect-square place-items-center rounded-full border text-xs font-bold ${index < card.saldo ? 'border-white bg-white text-violet-950 shadow-md' : 'border-white/25 bg-black/15 text-white/45'}`}>{index < card.saldo ? <Stamp className="h-4 w-4" /> : index + 1}</div>)}
      </div>
      <div className="relative mt-4"><div className="mb-1 flex justify-between text-xs"><span>{card.saldo} de {program.carimbos_necessarios} {program.rotulo_carimbo}(s)</span><span>{percent}%</span></div><Progress value={percent} className="h-2 bg-black/25" /></div>
      <div className="relative mt-4 rounded-xl bg-black/20 p-3"><p className="text-xs text-white/60">Sua recompensa</p><p className="font-semibold">{program.recompensa_descricao}</p>{card.saldo >= program.carimbos_necessarios && <Badge className="mt-2 bg-emerald-400 text-emerald-950">Pronta para resgatar</Badge>}</div>
    </div>
    <CardContent className="grid gap-6 p-5 md:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-2"><div className="rounded-2xl bg-white p-2"><LoyaltyQRCode token={card.public_token} size={164} /></div><p className="text-center text-xs text-muted-foreground">Apresente este QR Code no atendimento</p><Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(card.public_token).then(() => toast.success('Código copiado!'))}><Copy className="mr-2 h-3.5 w-3.5" /> Copiar código</Button></div>
      <div>
        <div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 font-semibold"><History className="h-4 w-4" /> Histórico</h3><Badge variant="outline">{card.total_resgates} resgate(s)</Badge></div>
        <CardHistory cardId={card.id} />
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Cartão pessoal e protegido</span>{expiresAt && <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> Válido até {expiresAt.toLocaleDateString('pt-BR')}</span>}</div>
        {program.termos && <details className="mt-4 rounded-lg border border-white/10 p-3 text-xs text-muted-foreground"><summary className="cursor-pointer font-medium text-foreground">Regras do programa</summary><p className="mt-2 whitespace-pre-wrap">{program.termos}</p></details>}
        <Button asChild variant="link" className="mt-2 px-0"><Link to={`/locais/${company.slug}`}>Visitar página da empresa</Link></Button>
      </div>
    </CardContent>
  </Card>;
};

const Fidelidade = () => {
  const { data = [], isLoading, error } = useMyLoyaltyCards();
  return <div className="container mx-auto max-w-5xl px-4 py-8 pb-28">
    <header className="mb-7"><Badge className="mb-3 bg-violet-500/15 text-violet-200"><Sparkles className="mr-1 h-3 w-3" /> Benefícios</Badge><h1 className="text-3xl font-bold">Meus cartões fidelidade</h1><p className="mt-2 text-muted-foreground">Acompanhe carimbos, recompensas e apresente seu QR Code no atendimento.</p></header>
    {isLoading && <div className="grid min-h-64 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-violet-300" /></div>}
    {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-200">Não foi possível carregar seus cartões agora.</div>}
    {!isLoading && !error && !data.length && <div className="rounded-3xl border border-dashed border-violet-400/25 bg-violet-500/5 p-10 text-center"><Gift className="mx-auto h-12 w-12 text-violet-300" /><h2 className="mt-4 text-xl font-semibold">Você ainda não possui cartões</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Entre no perfil de uma empresa participante e toque em “Quero participar”.</p><Button asChild className="mt-5"><Link to="/locais">Explorar empresas</Link></Button></div>}
    <div className="space-y-6">{data.map((card) => <DigitalCard key={card.id} card={card} />)}</div>
  </div>;
};

export default Fidelidade;
