import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DominoSpotlight } from '@/components/home/DominoSpotlight';

const steps = [
  { title: 'Entre na comunidade', text: 'Use sua conta do Saj Tem para acessar o dominó.' },
  { title: 'Escolha sua mesa', text: 'Entre em uma sala. A partida começa quando os dois jogadores estiverem nela.' },
  { title: 'Jogue e suba no ranking', text: 'Vitória vale 3 pontos; empate, 1. Derrota desconta até 2, sem deixar sua pontuação negativa.' },
];

export default function Jogos() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <Link to="/" className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
          <ArrowLeft className="h-4 w-4" /> Início
        </Link>
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><Gamepad2 className="h-5 w-5" /> Jogos no Saj Tem</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Uma pausa. Uma partida. Boa companhia.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">Seu espaço para se divertir e desafiar a comunidade. Comece pelo nosso dominó online.</p>
      </header>
      <DominoSpotlight showGamesLink={false} />
      <section aria-labelledby="como-jogar-title" className="rounded-3xl border border-border bg-card p-5 sm:p-7">
        <h2 id="como-jogar-title" className="text-lg font-bold text-foreground">Da primeira pedra ao ranking</h2>
        <ol className="mt-5 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex min-w-0 gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">{index + 1}</span>
              <div><h3 className="text-sm font-bold text-foreground">{step.title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.text}</p></div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
