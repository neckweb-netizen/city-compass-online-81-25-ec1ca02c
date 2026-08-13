import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Megaphone, MessageCircle, ThumbsUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCidadePadrao } from '@/hooks/useCidadePadrao';
import { useProblemasCidade } from '@/hooks/useProblemasCidade';

export const VozDoPovoSection = () => {
  const { data: cidadePadrao } = useCidadePadrao();
  const { problemas, isLoading } = useProblemasCidade(cidadePadrao?.id, {
    ordenacao: 'recentes',
  });
  const problemasRecentes = problemas?.slice(0, 3) || [];

  return (
    <section className="w-full max-w-7xl mx-auto px-2 sm:px-4">
      <div className="rounded-3xl border border-border/60 bg-card p-5 sm:p-7 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 border-b border-border/40 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-primary/10 p-2 text-primary">
                <Megaphone className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-bold text-foreground sm:text-xl">Voz do Povo</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Relate problemas, acompanhe soluções e ajude a melhorar nossa cidade.
            </p>
          </div>

          <Link
            to="/reclamacoes"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Ver todas <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-36 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : problemasRecentes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {problemasRecentes.map((problema) => (
              <Link key={problema.id} to={`/reclamacoes/${problema.id}`}>
                <Card className="h-full rounded-2xl border-border/60 bg-muted/40 transition-all hover:border-primary/40 hover:shadow-md">
                  <CardContent className="flex h-full flex-col p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                        {problema.status === 'em_analise' ? 'Em análise' : problema.status}
                      </span>
                      {problema.categoria?.nome && (
                        <span className="truncate text-[10px] text-muted-foreground">
                          {problema.categoria.nome}
                        </span>
                      )}
                    </div>
                    <h3 className="line-clamp-2 text-sm font-bold text-foreground">
                      {problema.titulo}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {problema.descricao}
                    </p>
                    <div className="mt-auto flex items-center gap-3 pt-4 text-[11px] text-muted-foreground">
                      <span className="flex min-w-0 items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{problema.bairro || problema.endereco}</span>
                      </span>
                      <span className="ml-auto flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" /> {problema.votos_positivos}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> {problema.total_comentarios || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-2xl bg-muted/40 px-4 py-8 text-center">
            <Megaphone className="mb-3 h-8 w-8 text-primary/70" />
            <p className="text-sm font-semibold text-foreground">Sua voz também transforma a cidade</p>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              Nenhum relato público está ativo no momento. Você pode enviar uma reclamação ou sugestão.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link to="/reclamacoes">Acessar Voz do Povo</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
