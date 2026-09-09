import { Link } from 'react-router-dom';
import { FileText, Mail, ShieldCheck } from 'lucide-react';

const legalLinks = [
  { to: '/politica-de-privacidade', label: 'Política de Privacidade', icon: ShieldCheck },
  { to: '/termos-de-uso', label: 'Termos de Uso', icon: FileText },
];

export const SiteFooter = () => (
  <footer className="border-t border-border/60 bg-card/45 px-4 pb-24 pt-8 backdrop-blur-sm sm:px-6 lg:pb-8">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-md space-y-3">
        <Link to="/" className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <img src="/icon-192.png" alt="" className="h-10 w-10 rounded-xl" loading="lazy" />
          <span>
            <span className="block text-base font-bold text-foreground">Saj Tem</span>
            <span className="block text-xs text-muted-foreground">Santo Antônio de Jesus em um só lugar</span>
          </span>
        </Link>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Informação local, serviços, ferramentas e oportunidades para aproximar pessoas e empresas da nossa cidade.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:items-end">
        <nav aria-label="Links legais" className="flex flex-wrap gap-x-5 gap-y-3">
          {legalLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              {label}
            </Link>
          ))}
          <a
            href="mailto:suporte.sajtem@gmail.com"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Mail aria-hidden="true" className="h-4 w-4" />
            Fale conosco
          </a>
        </nav>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Saj Tem. Todos os direitos reservados.
        </p>
      </div>
    </div>
  </footer>
);

