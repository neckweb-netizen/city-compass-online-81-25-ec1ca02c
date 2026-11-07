import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getSafeNavigationUrl } from '@/lib/safeNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, DollarSign, FileText, NotebookPen, Search, ShieldCheck, Globe, Calculator, Percent, FileSpreadsheet, Volume2, Grid, Ticket, CarFront, HeartPulse, WalletCards, Baby, Pill, ChevronLeft, ChevronRight, Fuel, Scale, UtensilsCrossed } from 'lucide-react';

// COMPONENTE DE BANNER DINÂMICO PARA FERRAMENTAS
const BannersFerramentas = () => {
  const [banners, setBanners] = useState<any[]>([]);

  useEffect(() => {
    const buscarBanners = async () => {
      try {
        const { data } = await supabase
          .from("banners" as any)
          .select("*")
          .eq("ativo", true)
          .order("ordem", { ascending: true });

        if (data && data.length > 0) {
          setBanners(data);
        }
      } catch (err) {
        console.error("Erro ao buscar banners para ferramentas:", err);
      }
    };

    buscarBanners();
  }, []);

  if (banners.length === 0) return null;

  return (
    <div className="w-full space-y-3">
      {banners.map((b) => (
        <a
          key={b.id}
          href={getSafeNavigationUrl(b.link_destino) ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-2xl overflow-hidden shadow-sm border border-border/60 hover:opacity-95 transition-opacity"
        >
          <img
            src={b.imagem_url || b.imagem}
            alt={b.titulo || "Banner de Anúncio"}
            className="w-full h-auto max-h-[160px] sm:max-h-[220px] object-cover"
          />
        </a>
      ))}
    </div>
  );
};

// CATÁLOGO DE FERRAMENTAS COM BANNERS DE ANÚNCIO
const FerramentasCatalogInternal = () => {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('Todas');
  const categoriasCarouselRef = useRef<HTMLDivElement>(null);

  const ferramentas = [
    {
      id: 'gerador-rifa',
      titulo: 'Gerador & Caderno de Rifas',
      descricao: 'Crie rifas personalizadas, controle pagamentos de números e compartilhe o link público com compradores.',
      icone: Ticket,
      rota: '/ferramentas/gerador-rifa',
      categoria: 'Sorteios',
      corGradiente: 'from-orange-500/20 via-orange-500/5 to-transparent border-orange-500/30',
      corTexto: 'text-orange-500',
    },
    {
      id: 'gerador-cobranca',
      titulo: 'Gerador de Cobrança PIX',
      descricao: 'Crie mensagens de cobrança amigáveis ou formais pré-formatadas para enviar no WhatsApp em segundos.',
      icone: DollarSign,
      rota: '/ferramentas/gerador-cobranca',
      categoria: 'Financeiro',
      corGradiente: 'from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500/30',
      corTexto: 'text-emerald-500',
    },
    {
      id: 'criador-curriculo',
      titulo: 'Criador de Currículo PDF',
      descricao: 'Monte seu currículo profissional no formato padrão A4 e faça o download em PDF para enviar às vagas da região.',
      icone: FileText,
      rota: '/ferramentas/criador-curriculo',
      categoria: 'Carreira',
      corGradiente: 'from-blue-500/20 via-blue-500/5 to-transparent border-blue-500/30',
      corTexto: 'text-blue-500',
    },
    {
      id: 'gestao-cobrancas',
      titulo: 'Caderno de Cobranças & Micro CRM',
      descricao: 'Gerencie clientes, controle quem te deve, valores a receber, datas de vencimento e histórico completo de cobranças.',
      icone: NotebookPen,
      rota: '/ferramentas/gestao-cobrancas',
      categoria: 'Gestão',
      corGradiente: 'from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/30',
      corTexto: 'text-amber-500',
    },
    {
      id: 'calculadora-orcamento',
      titulo: 'Calculadora de Hora & Orçamentos',
      descricao: 'Descubra quanto cobrar por hora de trabalho e crie orçamentos detalhados para enviar direto ao seu cliente.',
      icone: Calculator,
      rota: '/ferramentas/calculadora-orcamento',
      categoria: 'Precificação',
      corGradiente: 'from-purple-500/20 via-purple-500/5 to-transparent border-purple-500/30',
      corTexto: 'text-purple-500',
    },
    {
      id: 'calculadora-margem',
      titulo: 'Calculadora de Margem & Maquininha',
      descricao: 'Simule taxas das principais maquininhas de cartão, defina sua margem de lucro e encontre o preço de venda ideal.',
      icone: Percent,
      rota: '/ferramentas/calculadora-margem',
      categoria: 'Comércio',
      corGradiente: 'from-pink-500/20 via-pink-500/5 to-transparent border-pink-500/30',
      corTexto: 'text-pink-500',
    },
    {
      id: 'simulador-rescisao',
      titulo: 'Simulador de Rescisão (CLT)',
      descricao: 'Simule seus direitos trabalhistas, aviso prévio, férias proporcionais, 13º e multa do FGTS de forma simples.',
      icone: FileSpreadsheet,
      rota: '/ferramentas/simulador-rescisao',
      categoria: 'Trabalho',
      corGradiente: 'from-cyan-500/20 via-cyan-500/5 to-transparent border-cyan-500/30',
      corTexto: 'text-cyan-500',
    },
    {
      id: 'leitor-voz',
      titulo: 'Leitor de Texto em Voz Alta',
      descricao: 'Converta qualquer texto em áudio narrado com ajuste de tom, velocidade e voz em tempo real.',
      icone: Volume2,
      rota: '/ferramentas/leitor-voz',
      categoria: 'Acessibilidade',
      corGradiente: 'from-indigo-500/20 via-indigo-500/5 to-transparent border-indigo-500/30',
      corTexto: 'text-indigo-500',
    },
    {
      id: 'ciclo-menstrual',
      titulo: 'Calendário de Ciclo Menstrual',
      descricao: 'Acompanhe menstruação, sintomas, janela fértil e ovulação estimadas com calendário e histórico privado no aparelho.',
      icone: HeartPulse,
      rota: '/ferramentas/ciclo-menstrual',
      categoria: 'Saúde',
      corGradiente: 'from-rose-500/20 via-rose-500/5 to-transparent border-rose-500/30',
      corTexto: 'text-rose-500',
    },
    {
      id: 'controle-financeiro',
      titulo: 'Controle Financeiro Pessoal',
      descricao: 'Organize receitas, despesas, contas a vencer, calendário financeiro, orçamento e metas com dados privados no aparelho.',
      icone: WalletCards,
      rota: '/ferramentas/controle-financeiro',
      categoria: 'Financeiro',
      corGradiente: 'from-emerald-500/20 via-teal-500/5 to-transparent border-emerald-500/30',
      corTexto: 'text-emerald-600',
    },
    {
      id: 'acompanhamento-gestacional',
      titulo: 'Acompanhamento Gestacional',
      descricao: 'Acompanhe semanas, DPP, agenda de consultas e exames, diário de sintomas e marcos da gestação com sincronização na sua conta.',
      icone: Baby,
      rota: '/ferramentas/acompanhamento-gestacional',
      categoria: 'Saúde',
      corGradiente: 'from-fuchsia-500/20 via-rose-500/5 to-transparent border-fuchsia-500/30',
      corTexto: 'text-fuchsia-600',
    },
    {
      id: 'medicamentos',
      titulo: 'Medicamentos e Lembretes',
      descricao: 'Organize medicamentos e horários, registre doses e receba lembretes automáticos com sincronização na sua conta.',
      icone: Pill,
      rota: '/ferramentas/medicamentos',
      categoria: 'Saúde',
      corGradiente: 'from-violet-500/20 via-indigo-500/5 to-transparent border-violet-500/30',
      corTexto: 'text-violet-600',
    },
    {
      id: 'meu-veiculo',
      titulo: 'Meu Veículo — Controle Automotivo',
      descricao: 'Controle abastecimentos, consumo, gastos, manutenções, documentos e receba lembretes automáticos.',
      icone: CarFront,
      rota: '/ferramentas/meu-veiculo',
      categoria: 'Veículos',
      corGradiente: 'from-blue-500/20 via-sky-500/5 to-transparent border-blue-500/30',
      corTexto: 'text-blue-600',
    },
    {
      id: 'consulta-fipe',
      titulo: 'Consulta Tabela FIPE',
      descricao: 'Consulte o valor atualizado de carros, motos e caminhões por marca, modelo e ano.',
      icone: CarFront,
      rota: '/ferramentas/consulta-fipe',
      categoria: 'Veículos',
      corGradiente: 'from-sky-500/20 via-sky-500/5 to-transparent border-sky-500/30',
      corTexto: 'text-sky-500',
    },
    {
      id: 'calculadora-combustivel',
      titulo: 'Combustível e Custo da Viagem',
      descricao: 'Calcule litros, custo total, divisão entre passageiros e compare gasolina com etanol.',
      icone: Fuel,
      rota: '/ferramentas/calculadora-combustivel',
      categoria: 'Veículos',
      corGradiente: 'from-amber-500/20 via-orange-500/5 to-transparent border-amber-500/30',
      corTexto: 'text-amber-600',
    },
    {
      id: 'comparador-precos',
      titulo: 'Comparador de Preços por Unidade',
      descricao: 'Compare embalagens de tamanhos diferentes e descubra qual opção realmente custa menos.',
      icone: Scale,
      rota: '/ferramentas/comparador-precos',
      categoria: 'Compras',
      corGradiente: 'from-teal-500/20 via-cyan-500/5 to-transparent border-teal-500/30',
      corTexto: 'text-teal-600',
    },
    {
      id: 'cardapio-digital',
      titulo: 'Cardápio Digital',
      descricao: 'Crie um perfil moderno com produtos, categorias, fotos, carrinho e pedidos pelo WhatsApp.',
      icone: UtensilsCrossed,
      rota: '/ferramentas/cardapio-digital',
      categoria: 'Comércio',
      corGradiente: 'from-violet-500/20 via-fuchsia-500/5 to-transparent border-violet-500/30',
      corTexto: 'text-violet-600',
    },
  ];

  const categoriasUnicas = ['Todas', ...Array.from(new Set(ferramentas.map(f => f.categoria)))];

  const categoriaVisual: Record<string, { icone: typeof Grid; cor: string; fundo: string }> = {
    Todas: { icone: Grid, cor: 'text-violet-600 dark:text-violet-300', fundo: 'bg-violet-100 dark:bg-violet-950/50' },
    Sorteios: { icone: Ticket, cor: 'text-orange-600 dark:text-orange-300', fundo: 'bg-orange-100 dark:bg-orange-950/50' },
    Financeiro: { icone: WalletCards, cor: 'text-emerald-600 dark:text-emerald-300', fundo: 'bg-emerald-100 dark:bg-emerald-950/50' },
    Carreira: { icone: FileText, cor: 'text-blue-600 dark:text-blue-300', fundo: 'bg-blue-100 dark:bg-blue-950/50' },
    Gestão: { icone: NotebookPen, cor: 'text-amber-600 dark:text-amber-300', fundo: 'bg-amber-100 dark:bg-amber-950/50' },
    Precificação: { icone: Calculator, cor: 'text-purple-600 dark:text-purple-300', fundo: 'bg-purple-100 dark:bg-purple-950/50' },
    Comércio: { icone: Percent, cor: 'text-pink-600 dark:text-pink-300', fundo: 'bg-pink-100 dark:bg-pink-950/50' },
    Trabalho: { icone: FileSpreadsheet, cor: 'text-cyan-600 dark:text-cyan-300', fundo: 'bg-cyan-100 dark:bg-cyan-950/50' },
    Acessibilidade: { icone: Volume2, cor: 'text-indigo-600 dark:text-indigo-300', fundo: 'bg-indigo-100 dark:bg-indigo-950/50' },
    Saúde: { icone: HeartPulse, cor: 'text-rose-600 dark:text-rose-300', fundo: 'bg-rose-100 dark:bg-rose-950/50' },
    Veículos: { icone: CarFront, cor: 'text-sky-600 dark:text-sky-300', fundo: 'bg-sky-100 dark:bg-sky-950/50' },
    Compras: { icone: Scale, cor: 'text-teal-600 dark:text-teal-300', fundo: 'bg-teal-100 dark:bg-teal-950/50' },
  };

  const scrollCategorias = (direction: 'left' | 'right') => {
    categoriasCarouselRef.current?.scrollBy({
      left: direction === 'left' ? -320 : 320,
      behavior: 'smooth',
    });
  };

  const ferramentasFiltradas = ferramentas.filter(f => {
    const bateTexto = 
      f.titulo.toLowerCase().includes(busca.toLowerCase()) || 
      f.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      f.categoria.toLowerCase().includes(busca.toLowerCase());

    const bateCategoria = categoriaAtiva === 'Todas' || f.categoria === categoriaAtiva;

    return bateTexto && bateCategoria;
  });

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* BANNERS DE ANÚNCIO (PUXADOS DO BANCO DE DADOS) */}
        <BannersFerramentas />

        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs uppercase tracking-wider font-bold inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Central de Utilitários SAJ TEM
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            Ferramentas Gratuitas para o Seu Dia a Dia
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Soluções práticas e inteligentes desenvolvidas para facilitar o trabalho de autônomos, profissionais e moradores de Santo Antônio de Jesus.
          </p>

          <div className="relative max-w-md mx-auto pt-2">
            <Search className="w-4 h-4 absolute left-3.5 top-5 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar ferramenta..." 
              value={busca} 
              onChange={e => setBusca(e.target.value)} 
              className="pl-10 h-11 text-xs sm:text-sm rounded-xl border-border shadow-sm"
            />
          </div>
        </div>

        <section className="relative mx-auto w-full max-w-6xl pt-1" aria-label="Categorias de ferramentas">
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <p className="text-sm font-black text-foreground">Explore por categoria</p>
              <p className="text-[11px] text-muted-foreground sm:text-xs">Arraste para o lado e escolha o que você precisa</p>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => scrollCategorias('left')}
                className="h-9 w-9 rounded-full bg-background shadow-sm"
                aria-label="Categorias anteriores"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => scrollCategorias('right')}
                className="h-9 w-9 rounded-full bg-background shadow-sm"
                aria-label="Próximas categorias"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-8 bg-gradient-to-r from-background to-transparent sm:block" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-8 bg-gradient-to-l from-background to-transparent sm:block" />

            <div
              ref={categoriasCarouselRef}
              className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-3 pt-1 scroll-smooth overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-8"
            >
              {categoriasUnicas.map((cat) => {
                const isSelected = categoriaAtiva === cat;
                const visual = categoriaVisual[cat] || categoriaVisual.Todas;
                const IconeCategoria = visual.icone;
                const quantidade = cat === 'Todas'
                  ? ferramentas.length
                  : ferramentas.filter((f) => f.categoria === cat).length;

                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setCategoriaAtiva(cat)}
                    className={`group min-w-[92px] snap-start rounded-2xl border px-2.5 py-3 text-center transition-all duration-200 sm:min-w-[108px] sm:px-3 sm:py-3.5 ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/15 -translate-y-0.5'
                        : 'border-border/70 bg-card text-foreground shadow-sm hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span className={`mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl transition-transform group-hover:scale-105 ${
                      isSelected ? 'bg-primary-foreground/15 text-primary-foreground' : `${visual.fundo} ${visual.cor}`
                    }`}>
                      <IconeCategoria className="h-5 w-5" />
                    </span>
                    <span className="block truncate text-[11px] font-extrabold sm:text-xs">{cat}</span>
                    <span className={`mt-0.5 block text-[9px] font-semibold ${isSelected ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>
                      {quantidade} {quantidade === 1 ? 'ferramenta' : 'ferramentas'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {ferramentasFiltradas.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Search className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
            <h3 className="text-base font-bold text-foreground">Nenhuma ferramenta encontrada</h3>
            <p className="text-xs text-muted-foreground">Tente buscar por outro termo ou mude a categoria selecionada.</p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => { setBusca(''); setCategoriaAtiva('Todas'); }}
              className="text-xs rounded-xl mt-2"
            >
              Limpar Filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {ferramentasFiltradas.map((item) => {
              const Icone = item.icone;
              return (
                <Card 
                  key={item.id}
                  className={`border bg-gradient-to-b ${item.corGradiente} shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group rounded-2xl overflow-hidden`}
                >
                  <CardContent className="p-6 space-y-4 flex flex-col justify-between h-full">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className={`p-3 rounded-2xl bg-background/80 border border-border shadow-sm ${item.corTexto}`}>
                          <Icone className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                            {item.categoria}
                          </Badge>
                          <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Público
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          {item.titulo}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {item.descricao}
                        </p>
                      </div>
                    </div>

                    <Button 
                      onClick={() => navigate(item.rota)}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 rounded-xl flex items-center justify-center gap-2 text-xs group-hover:translate-x-0.5 transition-all shadow-md mt-4"
                    >
                      <span>Acessar Ferramenta</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="p-4 bg-muted/30 border border-border/60 rounded-2xl text-center flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Todas as suas informações registradas nas ferramentas são 100% privadas e armazenadas com segurança.</span>
        </div>

      </div>
    </div>
  );
};


export default FerramentasCatalogInternal;
