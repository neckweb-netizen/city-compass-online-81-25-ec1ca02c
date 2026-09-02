import { ArrowRight, Gamepad2, Play, Trophy, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const pipPositions: Record<number, [number, number][]> = {
  2: [[10, 10], [30, 30]],
  4: [[10, 10], [30, 10], [10, 30], [30, 30]],
  6: [[10, 10], [30, 10], [10, 20], [30, 20], [10, 30], [30, 30]],
};

function IllustrationTile({ x, y, angle, values }: {
  x: number; y: number; angle: number; values: [number, number];
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle} 26 50)`}>
      <rect x="2" y="5" width="52" height="100" rx="12" fill="#000" opacity=".3" />
      <rect width="52" height="100" rx="12" fill="#f8f4ed" stroke="#ded4bf" strokeWidth="2" />
      <path d="M8 50h36" stroke="#c69c58" strokeWidth="2" />
      {values.map((value, half) => (
        <g key={half} transform={`translate(6 ${half * 48 + 6})`}>
          {pipPositions[value].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3.7" fill="#221b35" />)}
        </g>
      ))}
    </g>
  );
}

export function DominoSpotlight({ showGamesLink = true }: { showGamesLink?: boolean }) {
  return (
    <section aria-label="Dominó online no Saj Tem" className="mx-auto w-full max-w-6xl">
      {showGamesLink && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Gamepad2 className="h-5 w-5 text-primary" /> Hora de jogar
          </h2>
          <Link to="/jogos" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
            Explorar jogos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
      <div className="relative isolate overflow-hidden rounded-3xl border border-violet-400/25 bg-[#171125] text-white shadow-xl shadow-black/10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.28),transparent_65%)]" />
        <div className="relative grid items-center md:grid-cols-[1.15fr_1fr]">
          <div className="min-w-0 p-6 sm:p-8 lg:p-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-violet-200">
              <Gamepad2 className="h-3.5 w-3.5" /> DOMINÓ ONLINE
            </span>
            <h2 className="mt-4 max-w-md text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Sua próxima partida <span className="text-violet-300">começa aqui.</span>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">
              Puxe uma cadeira, encontre um adversário e coloque sua estratégia na mesa. O clássico dominó, agora no Saj Tem.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-violet-100 sm:text-sm">
              <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-violet-300" /> 2 jogadores</span>
              <span className="inline-flex items-center gap-1.5"><Trophy className="h-4 w-4 text-amber-300" /> Ranking da comunidade</span>
            </div>
            <Button asChild className="mt-6 h-12 w-full rounded-xl bg-violet-500 px-6 text-base font-bold text-white shadow-lg shadow-violet-950/50 hover:bg-violet-400 sm:w-auto">
              <Link to="/domino"><Play className="mr-2 h-4 w-4 fill-current" /> Jogar dominó <ArrowRight className="ml-3 h-4 w-4" /></Link>
            </Button>
            <p className="mt-3 text-xs text-slate-400">Entre com sua conta para participar das partidas.</p>
          </div>
          <div aria-hidden="true" className="relative mx-6 mb-6 overflow-hidden rounded-2xl border border-emerald-300/20 bg-[#083f35] shadow-[inset_0_2px_30px_rgba(0,0,0,0.35)] sm:mx-8 md:mb-0 md:ml-0 md:mr-8">
            <div className="absolute inset-3 rounded-xl border border-emerald-200/10" />
            <svg viewBox="0 0 360 265" className="relative mx-auto block w-full max-w-sm" focusable="false">
              <ellipse cx="180" cy="200" rx="120" ry="22" fill="#000" opacity=".13" />
              <IllustrationTile x={77} y={72} angle={-24} values={[6, 4]} />
              <IllustrationTile x={153} y={65} angle={0} values={[6, 6]} />
              <IllustrationTile x={229} y={72} angle={24} values={[4, 2]} />
              <text x="180" y="227" textAnchor="middle" fill="#b6d5c7" fontSize="10" letterSpacing="3" fontFamily="sans-serif">A MESA É SUA</text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
