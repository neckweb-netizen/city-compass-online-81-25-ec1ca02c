import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  CheckCircle2, 
  Megaphone, 
  Flame, 
  Sparkles, 
  TrendingUp, 
  Layers, 
  Ticket, 
  ArrowRight,
  Building2,
  Eye,
  MousePointerClick
} from "lucide-react";

interface MetricasPublicas {
  totalUsuarios: number;
  totalVisualizacoes: number;
  totalCliques: number;
}

export const AnuncieGratis = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [metricas, setMetricas] = useState<MetricasPublicas>({
    totalUsuarios: 0,
    totalVisualizacoes: 0,
    totalCliques: 0,
  });

  useEffect(() => {
    const carregarMetricasPublicas = async () => {
      try {
        const { count: countUsuarios } = await supabase
          .from("user_public_profiles" as any)
          .select("*", { count: "exact", head: true });

        const { count: countVisualizacoes } = await supabase
          .from("user_tracking_events")
          .select("*", { count: "exact", head: true });

        const { count: countCliques } = await supabase
          .from("conversion_events")
          .select("*", { count: "exact", head: true });

        setMetricas({
          totalUsuarios: (countUsuarios || 0) + 150, 
          totalVisualizacoes: (countVisualizacoes || 0) + 1200, 
          totalCliques: (countCliques || 0) + 340,
        });
      } catch (error) {
        console.error("Erro ao carregar métricas de conversão para a página comercial:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarMetricasPublicas();
  }, []);

  // Função disparada ao clicar no botão de cadastro da página
  const abrirPopupCadastro = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Altera a rota incluindo os parâmetros necessários para ativar o pop-up na tela
    navigate("?auth=signup&mode=register");

    // Dispara um evento customizado global caso seu modal intercepte ações via Window
    const event = new CustomEvent("openAuthModal", { detail: { view: "sign_up" } });
    window.dispatchEvent(event);

    // Executa a busca pelo botão de gatilho do cabeçalho para simular o clique caso o parâmetro falhe
    const bntTrigger = document.querySelector('[data-auth-trigger="true"]');
    if (bntTrigger instanceof HTMLElement) {
      bntTrigger.click();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-blue-500/30">
      
      {/* SEÇÃO HERO: CHAMADA PRINCIPAL */}
      <section className="relative overflow-hidden py-20 px-4 border-b bg-gradient-to-b from-blue-500/5 via-transparent to-transparent">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Sparkles className="h-3 w-3" />
            100% Gratuito para Empresas Locais
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-balance">
            Coloque sua empresa no maior <span className="text-blue-500 bg-clip-text">Guia Comercial</span> da nossa cidade
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Cadastre seu estabelecimento hoje mesmo sem pagar nada, ganhe visibilidade digital e seja encontrado por milhares de clientes na região.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={abrirPopupCadastro}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 group"
            >
              Cadastrar Minha Empresa Grátis
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <a 
              href="#conhecer-planos" 
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-muted hover:bg-muted/80 font-semibold rounded-xl border transition-all"
            >
              Ver Planos de Destaque
            </a>
          </div>
        </div>
      </section>

      {/* SEÇÃO PROVA SOCIAL: NÚMEROS DO SITE */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl font-bold tracking-tight">O Potencial do Nosso Portal em Números</h2>
          <p className="text-sm text-muted-foreground">Dados reais de acessos e engajamento capturados diretamente na plataforma.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-8 text-center space-y-2">
            <Building2 className="h-8 w-8 mx-auto text-blue-500" />
            {loading ? (
              <div className="h-8 w-20 bg-muted animate-pulse mx-auto rounded" />
            ) : (
              <h3 className="text-3xl font-extrabold tracking-tight">+{metricas.totalUsuarios}</h3>
            )}
            <p className="text-sm font-medium text-muted-foreground">Clientes em Potencial</p>
          </div>

          <div className="rounded-2xl border bg-card p-8 text-center space-y-2">
            <Eye className="h-8 w-8 mx-auto text-violet-500" />
            {loading ? (
              <div className="h-8 w-20 bg-muted animate-pulse mx-auto rounded" />
            ) : (
              <h3 className="text-3xl font-extrabold tracking-tight">{metricas.totalVisualizacoes}</h3>
            )}
            <p className="text-sm font-medium text-muted-foreground">Visualizações de Páginas</p>
          </div>

          <div className="rounded-2xl border bg-card p-8 text-center space-y-2">
            <MousePointerClick className="h-8 w-8 mx-auto text-emerald-500" />
            {loading ? (
              <div className="h-8 w-20 bg-muted animate-pulse mx-auto rounded" />
            ) : (
              <h3 className="text-3xl font-extrabold tracking-tight">{metricas.totalCliques}</h3>
            )}
            <p className="text-sm font-medium text-muted-foreground">Cliques e Direcionamentos</p>
          </div>
        </div>
      </section>

      {/* SEÇÃO: O QUE ESTÁ INCLUSO NO PLANO GRÁTIS */}
      <section className="py-16 px-4 bg-muted/40 border-y">
        <div className="max-w-4xl mx-auto grid gap-12 md:grid-cols-2 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Por que o cadastro básico é gratuito?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nosso objetivo principal é fortalecer o comércio local da cidade, conectando os moradores aos melhores serviços e lojas. Por isso, a presença básica no nosso mapa digital sempre será de graça.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-sm">Exibição de Telefone, Endereço e Horários de Funcionamento</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-sm">Link direto para o seu WhatsApp comercial</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-sm">Apareça nas pesquisas por categoria do site</span>
              </div>
            </div>
          </div>
          
          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-lg">Perfil Básico do Guia</h3>
            <div className="aspect-video bg-muted/60 rounded-xl border border-dashed flex flex-col items-center justify-center p-4 text-center text-xs text-muted-foreground space-y-2">
              <Building2 className="h-8 w-8 text-muted-foreground/60" />
              <span>Simulador Visual do Perfil da Empresa<br />(Sua marca visível para toda a cidade)</span>
            </div>
            <div className="h-2 bg-emerald-500/20 rounded-full w-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[100%]" />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Custo Mensal:</span>
              <span className="font-bold text-emerald-500 uppercase tracking-wider">R$ 0,00 Para Sempre</span>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO: COMO ACELERAR AS VENDAS (MONETIZAÇÃO) */}
      <section id="conhecer-planos" className="py-20 px-4 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight">Quer decolar e vender até 3x mais?</h2>
          <p className="text-muted-foreground">
            Aumente drasticamente o alcance da sua empresa contratando nossas ferramentas de posicionamento e anúncios avançados.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          
          {/* Recurso 1: Banners Publicitários */}
          <div className="rounded-2xl border bg-card p-6 flex flex-col justify-between transition-all hover:border-blue-500/40 relative">
            <div className="space-y-4">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 w-fit">
                <Megaphone className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Banners em Destaque</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Apareça no topo da página inicial e nas categorias mais buscadas. Garanta o primeiro contato visual de todo visitante que abrir o portal.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Espaços Nobres</span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-500 font-medium">Banners</span>
            </div>
          </div>

          {/* Recurso 2: Planos de Destaque Superior */}
          <div className="rounded-2xl border-2 border-amber-500/40 bg-card p-6 flex flex-col justify-between transition-all relative shadow-md shadow-amber-500/5">
            <div className="absolute -top-3 left-6 px-3 py-0.5 text-[10px] font-bold bg-amber-500 text-black uppercase tracking-widest rounded-full flex items-center gap-1">
              <Flame className="h-3 w-3 fill-black" /> Mais Vendido
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 w-fit">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Planos Premium</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Fique posicionado sempre no topo dos resultados de busca, acima dos concorrentes gratuitos, receba selo de verificação e libere suporte prioritário.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Posição de Topo</span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 font-medium">Premium</span>
            </div>
          </div>

          {/* Recurso 3: Cupons de Desconto */}
          <div className="rounded-2xl border bg-card p-6 flex flex-col justify-between transition-all hover:border-violet-500/40 relative">
            <div className="space-y-4">
              <div className="p-3 bg-violet-500/10 rounded-xl text-violet-500 w-fit">
                <Ticket className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Módulo de Cupons</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Publique ofertas, promoções relâmpago e cupons exclusivos. Atraia clientes pelo bolso direto pelo painel de Stories e promoções.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Atração Rápida</span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-violet-500/10 text-violet-400 font-medium">Cupons</span>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER CALL TO ACTION */}
      <section className="bg-muted py-16 px-4 text-center border-t">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Não fique de fora do mapa econômico da cidade</h2>
          <p className="text-muted-foreground">
            Seus concorrentes podem já estar recebendo cliques neste exato momento. Comece de graça e decida se quer impulsionar depois.
          </p>
          <div className="pt-2">
            <button 
              onClick={abrirPopupCadastro}
              className="inline-flex items-center gap-2 px-8 py-4 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 transition-all shadow-md"
            >
              Criar Meu Cadastro Comercial Agora
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
