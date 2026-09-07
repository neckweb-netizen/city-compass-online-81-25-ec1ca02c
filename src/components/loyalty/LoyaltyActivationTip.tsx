import { Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLoyaltyProgram } from '@/hooks/useLoyalty';

export const LoyaltyActivationTip = ({ empresaId, onActivate }: { empresaId: string; onActivate: () => void }) => {
  const { data, isLoading } = useLoyaltyProgram(empresaId);
  if (isLoading || data?.ativo) return null;

  return (
    <div className="md:col-span-2 overflow-hidden rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-950/80 via-[#241733] to-fuchsia-950/60 p-5 shadow-lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-500/20 text-violet-200">
            <Gift className="h-6 w-6" />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-300">
              <Sparkles className="h-3.5 w-3.5" /> Aumente a recorrência
            </div>
            <h3 className="font-semibold text-white">Ative seu cartão fidelidade</h3>
            <p className="mt-1 max-w-2xl text-sm text-white/65">Premie clientes frequentes com carimbos digitais, QR Code, resgates seguros e histórico completo.</p>
          </div>
        </div>
        <Button onClick={onActivate} className="shrink-0 bg-violet-500 text-white hover:bg-violet-400">Configurar agora</Button>
      </div>
    </div>
  );
};
