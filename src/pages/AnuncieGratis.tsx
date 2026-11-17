import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BellRing, Building2, Check, ChevronDown,
  CircleHelp, Compass, Eye, Gift, Globe2, HeartHandshake, MapPin, Megaphone,
  MessageCircle, MousePointerClick, Search, ShieldCheck, Smartphone, Sparkles,
  Star, Store, Target, TicketPercent, TrendingUp, Users, WandSparkles,
} from 'lucide-react';

const beneficios = [
  {
    icon: Search, title: 'Seja encontrado por quem procura',
    text: 'Apresente seu negócio nas pesquisas e categorias do guia comercial, onde pessoas descobrem opções da região.',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10',
  },
  {
    icon: Smartphone, title: 'Uma vitrine que funciona no celular',
    text: 'Dê aos clientes um lugar para consultar informações do seu negócio com praticidade, em qualquer tela.',
    color: 'text-violet-600 bg-violet-50 dark:bg-violet-500/10',
  },
  {
    icon: MessageCircle, title: 'Facilite o primeiro contato',
    text: 'Disponibilize informações de contato e aproxime interessados da sua equipe pelos canais cadastrados.',
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10',
  },
  {
    icon: MapPin, title: 'Valorize sua presença local',
    text: 'Mostre onde sua empresa atua e ajude moradores e visitantes a conhecerem seu estabelecimento.',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10',
  },
  {
    icon: Megaphone, title: 'Dê visibilidade às campanhas',
    text: 'Consulte as opções comerciais de anúncios e espaços de divulgação disponíveis para o seu negócio.',
    color: 'text-pink-600 bg-pink-50 dark:bg-pink-500/10',
  },
  {
    icon: TicketPercent, title: 'Promova suas oportunidades',
    text: 'Conheça os recursos de divulgação de ofertas e ações promocionais, conforme o plano contratado.',
    color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10',
  },
];

const passos = [
  { numero: '01', titulo: 'Cadastre seu negócio', texto: 'Comece informando os dados essenciais da empresa no nosso fluxo de cadastro.' },
  { numero: '02', titulo: 'Prepare sua presença digital', texto: 'Organize a apresentação, a categoria e os canais de contato do estabelecimento.' },
  { numero: '03', titulo: 'Escolha sua divulgação', texto: 'Conheça as condições comerciais e os recursos disponíveis para contratação.' },
  { numero: '04', titulo: 'Aproxime-se de novos clientes', texto: 'Após a aprovação e a ativação dos recursos contratados, sua empresa pode ser descoberta no portal.' },
];

const diferenciais = [
  { icon: Store, text: 'Perfil comercial para apresentar sua marca' },
  { icon: Compass, text: 'Descoberta por área de interesse e categoria' },
  { icon: MousePointerClick, text: 'Caminhos simples para entrar em contato' },
  { icon: BadgeCheck, text: 'Possibilidade de recursos de destaque conforme plano' },
  { icon: Globe2, text: 'Presença digital complementar às redes sociais' },
  { icon: HeartHandshake, text: 'Foco no comércio e nos serviços da região' },
];

const perguntas = [
  { q: 'O cadastro e a divulgação são gratuitos?', a: 'Não apresentamos a divulgação comercial como gratuita. As condições, os valores e os recursos disponíveis dependem da oferta e do plano contratado. Confira as informações comerciais antes de confirmar a contratação.' },
  { q: 'Minha empresa aparece imediatamente?', a: 'O cadastro pode passar por análise e aprovação. A publicação e os recursos de destaque dependem das condições e da ativação do serviço contratado.' },
  { q: 'Preciso ter um site para participar?', a: 'Não. Um perfil comercial no guia pode complementar sua presença digital e ajudar a apresentar seu negócio aos visitantes.' },
  { q: 'Posso divulgar serviços além de lojas?', a: 'Sim. O portal reúne negócios locais de diferentes segmentos. Escolha a categoria adequada durante o cadastro, conforme a disponibilidade.' },
  { q: 'O SAJ TEM garante vendas ou posição fixa na busca?', a: 'Não. Visibilidade, contatos e vendas dependem de diversos fatores. Recursos de destaque, quando oferecidos, seguem as condições específicas do plano contratado.' },
];

export const AnuncieGratis = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [perguntaAberta, setPerguntaAberta] = useState<number | null>(0);

  const iniciarCadastro = () => {
    if (user) {
      navigate('/cadastro-local');
      return;
    }
    // Existing header integration opens the business-registration dialog.
    navigate('/anuncie-gratis?auth=signup&mode=register');
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Opening pitch */}
      <section className="relative isolate overflow-hidden bg-[#0c1124] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-40 h-[35rem] w-[35rem] rounded-full bg-violet-600/20 blur-[110px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-56 left-[-8rem] h-[32rem] w-[32rem] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:gap-14 lg:pb-28 lg:pt-24">
          <div className="space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-white/10 px-4 py-2 text-xs font-bold tracking-wide text-violet-100">
              <Sparkles className="h-4 w-4 text-violet-300" /> SAJ TEM PARA NEGÓCIOS
            </span>
            <h1 className="max-w-2xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.8rem]">
              Seu negócio merece <span className="bg-gradient-to-r from-sky-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">ser descoberto.</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Transforme a presença da sua empresa na região. Apresente o que você oferece,
              facilite o contato com interessados e descubra novas oportunidades de divulgação no SAJ TEM.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={iniciarCadastro}
                className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-4 text-sm font-extrabold text-white shadow-xl shadow-violet-700/25 transition-transform hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                Quero cadastrar meu negócio <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <a href="#beneficios" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-bold text-white transition-colors hover:bg-white/15">
                Conhecer os benefícios <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-slate-300 sm:text-sm">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Foco em negócios locais</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Experiência adaptada ao celular</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Planos e soluções comerciais</span>
            </div>
          </div>

          {/* Illustration made from native UI; no invented client testimonials or audience metrics */}
          <div className="relative mx-auto w-full max-w-[490px]">
            <div className="absolute -left-4 top-12 -rotate-6 rounded-2xl border border-white/15 bg-[#1d2943] px-4 py-3 shadow-2xl sm:-left-9">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-200"><Search className="h-4 w-4" /> Descubra negócios</div>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-white text-slate-900 shadow-[0_35px_95px_rgba(0,0,0,.36)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 text-white"><Store className="h-5 w-5" /></div><span className="text-lg font-black">SAJ <span className="text-violet-600">TEM</span></span></div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500">PRÉVIA ILUSTRATIVA</div>
              </div>
              <div className="relative h-40 overflow-hidden bg-gradient-to-br from-indigo-900 via-violet-700 to-fuchsia-500 p-6 text-white">
                <div className="absolute -right-6 -top-10 h-52 w-52 rounded-full border-[35px] border-white/10" />
                <div className="absolute bottom-[-2.5rem] right-12 h-36 w-36 rounded-full bg-fuchsia-300/20 blur-xl" />
                <div className="relative flex h-full flex-col justify-end">
                  <p className="text-xs font-semibold text-violet-100">Seu espaço no guia comercial</p>
                  <p className="mt-1 text-2xl font-extrabold">Sua marca em evidência</p>
                </div>
              </div>
              <div className="space-y-5 p-6">
                <div className="flex items-start gap-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Building2 className="h-7 w-7" /></div>
                  <div className="min-w-0"><p className="text-lg font-extrabold">Seu estabelecimento aqui</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" /> Santo Antônio de Jesus e região</p></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3"><Search className="mb-2 h-4 w-4 text-violet-600" /><p className="text-xs font-bold">Visibilidade local</p><p className="mt-1 text-[11px] text-slate-500">Seu negócio à descoberta</p></div>
                  <div className="rounded-xl bg-slate-50 p-3"><MessageCircle className="mb-2 h-4 w-4 text-emerald-600" /><p className="text-xs font-bold">Contato facilitado</p><p className="mt-1 text-[11px] text-slate-500">Mais perto de interessados</p></div>
                </div>
                <div className="flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-bold text-white"><MessageCircle className="h-4 w-4" /> Fale com a empresa</div>
                <p className="text-center text-[10px] text-slate-500">Exemplo de apresentação. Aparência e recursos variam conforme a disponibilidade.</p>
              </div>
            </div>
            <div className="absolute -bottom-5 -right-2 flex items-center gap-2 rounded-2xl border border-white/15 bg-[#1d2943] px-4 py-3 text-xs font-bold text-white shadow-2xl sm:-right-7"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Fortaleça sua presença digital</div>
          </div>
        </div>
      </section>

      <section id="beneficios" className="scroll-mt-24 bg-background px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-3xl">
            <span className="text-xs font-extrabold uppercase tracking-[.18em] text-violet-600 dark:text-violet-400">Muito além de um cartão de visitas</span>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">Mais motivos para as pessoas <span className="text-violet-600 dark:text-violet-400">escolherem conhecer você.</span></h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">O SAJ TEM ajuda negócios da região a construir presença digital e criar novos caminhos para a descoberta e o contato com clientes.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {beneficios.map(({ icon: Icon, title, text, color }) => (
              <article key={title} className="group rounded-[1.6rem] border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-xl hover:shadow-violet-500/5">
                <div className={`mb-6 grid h-13 w-13 place-items-center rounded-2xl p-3 ${color}`}><Icon className="h-7 w-7" /></div>
                <h3 className="text-lg font-extrabold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">Os recursos disponíveis e seus limites variam conforme o serviço ou plano contratado.</p>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-border bg-slate-50 px-5 py-20 dark:bg-slate-900/40 sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.18em] text-violet-600 dark:text-violet-400"><WandSparkles className="h-4 w-4" /> Visibilidade com propósito</span>
            <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">Você cuida do seu negócio. <span className="text-violet-600 dark:text-violet-400">A gente ajuda sua marca a aparecer.</span></h2>
            <p className="mt-5 max-w-xl leading-7 text-muted-foreground">Quem procura um produto ou serviço quer encontrar informações confiáveis, claras e fáceis de acessar. Sua empresa pode estar presente nessa jornada.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {diferenciais.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"><Icon className="h-4 w-4" /></div>
                  <p className="text-sm font-semibold leading-6">{text}</p>
                </div>
              ))}
            </div>
            <button type="button" onClick={iniciarCadastro} className="mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-extrabold text-white transition-colors hover:bg-violet-700">
              Quero fazer parte do SAJ TEM <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="relative grid gap-4">
            <div className="rounded-[2rem] border border-border bg-card p-7 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-600 text-white"><Target className="h-6 w-6" /></div>
                <div><p className="text-lg font-black">Seu próximo cliente começa buscando</p><p className="text-sm text-muted-foreground">Construa uma presença fácil de descobrir.</p></div>
              </div>
              <div className="mt-7 space-y-4">
                {[{ icon: Search, label: 'Alguém procura um serviço na região' }, { icon: Eye, label: 'Conhece as opções disponíveis no guia' }, { icon: MessageCircle, label: 'Encontra informações para entrar em contato' }].map(({ icon: Icon, label }, index) => (
                  <div key={label} className="flex items-center gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"><Icon className="h-5 w-5" /></span>
                    <div className="flex-1"><p className="text-sm font-semibold">{label}</p>{index < 2 && <div className="mt-3 h-px bg-border" />}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-700 p-6 text-white shadow-lg"><div className="flex items-start gap-3"><TrendingUp className="mt-1 h-6 w-6 shrink-0" /><div><p className="font-extrabold">Uma presença construída para durar</p><p className="mt-2 text-sm leading-6 text-violet-100">Divulgar sua marca é investir na forma como ela é encontrada, percebida e lembrada.</p></div></div></div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl"><span className="text-xs font-extrabold uppercase tracking-[.18em] text-violet-600 dark:text-violet-400">Simples de começar</span><h2 className="mt-4 text-3xl font-black sm:text-4xl">Da sua ideia à sua presença no portal</h2><p className="mt-4 leading-7 text-muted-foreground">Um caminho claro para apresentar sua empresa e conhecer as oportunidades comerciais.</p></div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {passos.map((passo) => (
              <div key={passo.numero} className="relative rounded-[1.5rem] border border-border bg-card p-6 shadow-sm">
                <span className="text-4xl font-black tracking-tight text-violet-500/25">{passo.numero}</span>
                <h3 className="mt-5 text-lg font-extrabold">{passo.titulo}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{passo.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="solucoes" className="scroll-mt-24 bg-[#10162c] px-5 py-20 text-white sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[.18em] text-sky-300">Soluções de divulgação</span>
            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">Sua empresa tem objetivos. <span className="text-violet-300">Sua divulgação também deve ter.</span></h2>
            <p className="mt-5 max-w-xl leading-7 text-slate-300">Conheça as possibilidades de exposição no guia, apresentação comercial e ações de destaque, de acordo com a disponibilidade e as condições de cada plano.</p>
            <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold text-violet-100">
              {['Perfil comercial', 'Destaques', 'Banners', 'Campanhas', 'Promoções'].map(item => <span key={item} className="rounded-full border border-white/15 bg-white/10 px-3 py-2">{item}</span>)}
            </div>
            <button type="button" onClick={iniciarCadastro} className="mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-extrabold text-indigo-900 transition-colors hover:bg-violet-100">Conhecer a proposta para meu negócio <ArrowRight className="h-4 w-4" /></button>
          </div>
          <div className="rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur-sm sm:p-8">
            <div className="flex items-center gap-3"><ShieldCheck className="h-7 w-7 text-emerald-300" /><h3 className="text-xl font-extrabold">Comunicação transparente</h3></div>
            <div className="mt-7 space-y-5">
              {[
                ['Planos comerciais', 'Os serviços de divulgação são oferecidos mediante contratação.'],
                ['Benefícios conforme a oferta', 'Acesso, posicionamento e recursos extras dependem das condições vigentes.'],
                ['Sem promessas irreais', 'Não prometemos número de visualizações, clientes ou vendas.'],
              ].map(([titulo, descricao]) => <div key={titulo} className="flex gap-3"><Check className="mt-1 h-5 w-5 shrink-0 text-emerald-300" /><div><p className="font-bold">{titulo}</p><p className="mt-1 text-sm leading-6 text-slate-300">{descricao}</p></div></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center"><span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.18em] text-violet-600 dark:text-violet-400"><CircleHelp className="h-4 w-4" /> Tire suas dúvidas</span><h2 className="mt-4 text-3xl font-black sm:text-4xl">Perguntas frequentes</h2><p className="mt-3 text-muted-foreground">Informações claras antes de cadastrar sua empresa.</p></div>
          <div className="mt-10 space-y-3">
            {perguntas.map(({ q, a }, index) => (
              <div key={q} className="overflow-hidden rounded-2xl border border-border bg-card">
                <button type="button" aria-expanded={perguntaAberta === index} onClick={() => setPerguntaAberta(perguntaAberta === index ? null : index)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-sm font-bold transition-colors hover:bg-muted/50 sm:text-base">
                  {q}<ChevronDown className={`h-5 w-5 shrink-0 text-violet-600 transition-transform ${perguntaAberta === index ? 'rotate-180' : ''}`} />
                </button>
                {perguntaAberta === index && <p className="border-t border-border px-6 py-5 text-sm leading-7 text-muted-foreground">{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 lg:pb-28">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-800 px-7 py-14 text-center text-white shadow-2xl shadow-violet-800/20 sm:px-12 sm:py-20">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative mx-auto max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-extrabold"><Sparkles className="h-4 w-4" /> É hora de apresentar sua empresa</span>
            <h2 className="mt-6 text-3xl font-black leading-tight tracking-tight sm:text-5xl">Mais presença para sua marca começa com uma decisão.</h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-violet-100">Dê o primeiro passo para fazer parte do guia de negócios SAJ TEM e conheça nossas soluções comerciais.</p>
            <button type="button" onClick={iniciarCadastro} className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white px-7 py-4 text-sm font-extrabold text-indigo-900 shadow-lg transition-transform hover:-translate-y-0.5 sm:w-auto">Cadastrar meu negócio <ArrowRight className="h-5 w-5" /></button>
            <p className="mt-5 text-xs text-violet-100">Serviço comercial pago. Consulte condições e valores antes da contratação.</p>
          </div>
        </div>
      </section>

      {/* Mobile-only conversion CTA, without blocking the bottom navigation. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-40 px-4 pb-2 lg:hidden">
        <button type="button" onClick={iniciarCadastro} className="pointer-events-auto flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-extrabold text-white shadow-[0_12px_40px_rgba(59,30,145,.35)] hover:bg-violet-700">Cadastrar meu negócio <ArrowRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
};
