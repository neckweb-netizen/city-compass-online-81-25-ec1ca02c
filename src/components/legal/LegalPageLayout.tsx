import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, CalendarDays, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

interface LegalPageLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  sections: LegalSection[];
}

export const LegalPageLayout = ({ eyebrow, title, description, icon: Icon, sections }: LegalPageLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Voltar para a página anterior"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Voltar
        </button>

        <header className="overflow-hidden rounded-3xl border border-border/70 bg-card/90 p-6 shadow-xl shadow-primary/5 backdrop-blur sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Icon aria-hidden="true" className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
              <h1 className="text-balance text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">{title}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                Vigente desde 9 de setembro de 2026
              </div>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <aside className="rounded-2xl border border-border/70 bg-card p-5 lg:sticky lg:top-24">
            <h2 className="text-sm font-bold text-foreground">Nesta página</h2>
            <nav aria-label={`Índice de ${title}`} className="mt-3">
              <ol className="space-y-1">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="flex min-h-10 items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{index + 1}</span>
                      <span>{section.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-8">
            <div className="divide-y divide-border/70">
              {sections.map((section, index) => (
                <section key={section.id} id={section.id} className="scroll-mt-24 py-7 first:pt-0 last:pb-0">
                  <div className="mb-4 flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-black text-primary">{index + 1}</span>
                    <h2 className="text-xl font-bold leading-8 text-foreground sm:text-2xl">{section.title}</h2>
                  </div>
                  <div className="space-y-4 pl-0 text-sm leading-7 text-muted-foreground sm:pl-11 sm:text-[15px]">
                    {section.content}
                  </div>
                </section>
              ))}
            </div>
          </article>
        </div>

        <section className="mt-6 rounded-3xl border border-primary/20 bg-primary/5 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8">
          <div>
            <h2 className="text-lg font-bold text-foreground">Ficou com alguma dúvida?</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Fale com a equipe do Saj Tem sobre privacidade, seus dados ou estas condições.</p>
          </div>
          <a
            href="mailto:suporte.sajtem@gmail.com"
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/15 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:mt-0"
          >
            <Mail aria-hidden="true" className="h-4 w-4" />
            suporte.sajtem@gmail.com
          </a>
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Página inicial</Link>
          <Link to="/politica-de-privacidade" className="hover:text-primary">Política de Privacidade</Link>
          <Link to="/termos-de-uso" className="hover:text-primary">Termos de Uso</Link>
        </div>
      </div>
    </div>
  );
};

