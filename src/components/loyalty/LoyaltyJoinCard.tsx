import { Award, Gift, Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useJoinLoyaltyProgram } from '@/hooks/useLoyalty';

export const LoyaltyJoinCard = ({ empresaId, onLoginRequired }: { empresaId: string; onLoginRequired: () => void }) => {
  const { programQuery, cardQuery, join, user } = useJoinLoyaltyProgram(empresaId);
  const program = programQuery.data;
  if (programQuery.isLoading || !program?.ativo) return null;

  const card = cardQuery.data;
  const rewards = (program.loyalty_rewards || []).filter((reward) => reward.ativo).sort((a, b) => a.carimbos_necessarios - b.carimbos_necessarios);
  const nextReward = rewards.find((reward) => !card || card.saldo < reward.carimbos_necessarios) || rewards[rewards.length - 1];
  const goal = nextReward?.carimbos_necessarios || program.carimbos_necessarios;
  const handleJoin = async () => {
    if (!user) return onLoginRequired();
    try {
      await join.mutateAsync();
      toast.success('Seu cartão fidelidade foi criado!');
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível criar seu cartão.');
    }
  };

  return (
    <section className="container mx-auto px-4 pb-6" aria-labelledby="loyalty-title">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 p-5 shadow-xl sm:p-7" style={{ background: `linear-gradient(135deg, ${program.cor_principal}, #171022 72%)` }}>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl text-white">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/70"><Sparkles className="h-4 w-4" /> Clube de vantagens</div>
            <h2 id="loyalty-title" className="flex items-center gap-2 text-xl font-bold sm:text-2xl"><Gift className="h-6 w-6" /> {program.nome}</h2>
            <p className="mt-2 text-sm text-white/75">{program.descricao || 'Junte carimbos e escolha seu prêmio.'}</p>
            <div className="mt-3 flex flex-wrap gap-2">{rewards.slice(0, 4).map((reward) => <span key={reward.id} className="flex items-center gap-1 rounded-full bg-black/20 px-2.5 py-1 text-xs"><Award className="h-3 w-3" /> {reward.nome} · {reward.carimbos_necessarios}</span>)}</div>
            {card && (
              <div className="mt-4 max-w-md">
                <div className="mb-1 flex justify-between text-xs"><span>{card.saldo} de {goal} para o próximo prêmio</span><span>{Math.min(100, Math.round((card.saldo / goal) * 100))}%</span></div>
                <Progress value={Math.min(100, (card.saldo / goal) * 100)} className="h-2 bg-black/25" />
              </div>
            )}
          </div>
          {card ? (
            <Button asChild size="lg" className="bg-white text-violet-950 hover:bg-white/90"><Link to="/fidelidade">Abrir meu cartão</Link></Button>
          ) : (
            <Button onClick={handleJoin} disabled={join.isPending} size="lg" className="bg-white text-violet-950 hover:bg-white/90">
              {join.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Quero participar
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};
