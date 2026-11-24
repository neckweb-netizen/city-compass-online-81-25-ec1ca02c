import React, { useState, useEffect, useRef } from "react";
import { getJobApplicationHref } from "@/lib/jobApplication";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, Phone, Plus, AlertCircle, CheckCircle2, Tag, Calendar, Sparkles, X, User, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useLocation } from "react-router-dom";

interface ItemItem {
  id: string;
  tipo: "perdido" | "encontrado";
  titulo: string;
  descricao: string;
  categoria: string;
  local_fato: string;
  contato_nome: string;
  contato_telefone: string;
  status: string;
  created_at: string;
  usuario_id?: string;
}

const AchadosPerdidos = () => {
  const { toast } = useToast();
  const location = useLocation();
  const [itens, setItens] = useState<ItemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [resolvendoId, setResolvendoId] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const fetchSequence = useRef(0);
  const activeUserRef = useRef<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos"); // "todos" | "perdido" | "encontrado" | "meus"
  const [busca, setBusca] = useState<string>("");
  const [isModalAberto, setIsModalAberto] = useState(false);
  const [usuarioLogadoId, setUsuarioLogadoId] = useState<string | null>(null);

  // Estados do formulário de novo cadastro
  const [tipo, setTipo] = useState<"perdido" | "encontrado">("perdido");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Documentos");
  const [localFato, setLocalFato] = useState("");
  const [contatoNome, setContatoNome] = useState("");
  const [contatoTelefone, setContatoTelefone] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Captura a sessão do usuário logado no sistema
  useEffect(() => {
    let active = true;
    const syncUser = (id: string | null) => {
      if (!active) return;
      if (activeUserRef.current !== id) {
        fetchSequence.current += 1;
        setItens([]);
      }
      activeUserRef.current = id;
      setUsuarioLogadoId(id);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncUser(session?.user?.id ?? null);
    });
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (active && !activeUserRef.current) syncUser(session?.user?.id ?? null);
    }).catch(() => { if (active) syncUser(null); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  // Nunca trate "Minhas Postagens" como lista pública após o logout.
  useEffect(() => {
    if (!usuarioLogadoId && filtroTipo === "meus") setFiltroTipo("todos");
  }, [usuarioLogadoId, filtroTipo]);

  // Intercepta e abre o formulário APENAS se o clique veio do botão "+" (via state)
  useEffect(() => {
    if (location.state && (location.state as any).abrirModal === true) {
      setIsModalAberto(true);
      
      // Limpa o estado da rota para não reabrir o modal caso a página seja recarregada (F5)
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const buscarItens = async () => {
    const sequence = ++fetchSequence.current;
    try {
      setLoading(true);
      setLoadError(false);
      
      // Se o filtro selecionado for "meus", buscamos TODOS os estados do usuário (incluindo pendentes)
      // Se for os filtros comunitários normais, filtramos apenas os publicados e resolvidos
      let query = supabase
        .from("achados_perdidos" as any)
        .select("*");

      if (filtroTipo === "meus" && !usuarioLogadoId) {
        if (sequence === fetchSequence.current) setItens([]);
        return;
      }
      if (filtroTipo === "meus" && usuarioLogadoId) {
        query = query.eq("usuario_id", usuarioLogadoId);
      } else {
        query = query.in("status", ["aprovado", "resolvido"]);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      if (sequence === fetchSequence.current) setItens(data || []);
    } catch (error) {
      console.error("Erro ao buscar itens de achados e perdidos:", error);
      if (sequence === fetchSequence.current) setLoadError(true);
    } finally {
      if (sequence === fetchSequence.current) setLoading(false);
    }
  };

  // Recarrega os itens se o tipo de visualização ou o ID do usuário mudar
  useEffect(() => {
    void buscarItens();
    return () => { fetchSequence.current += 1; };
  }, [filtroTipo, usuarioLogadoId]);

  useEffect(() => {
    if (!isModalAberto) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submittingRef.current) setIsModalAberto(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    modalRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      (openButtonRef.current ?? previousFocus)?.focus();
    };
  }, [isModalAberto]);

  const handleCadastrarItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    const whatsapp = getJobApplicationHref("whatsapp", contatoTelefone);
    if (titulo.trim().length < 3 || titulo.trim().length > 160 || descricao.trim().length < 10 || descricao.trim().length > 4000 || localFato.trim().length < 2 || contatoNome.trim().length < 2 || !whatsapp) {
      toast({
        title: "Campos obrigatórios",
        description: "Informe título, descrição, local, nome e WhatsApp válidos para publicar a ocorrência.",
        variant: "destructive",
      });
      return;
    }

    submittingRef.current = true;
    try {
      setEnviando(true);
      const { error } = await supabase.from("achados_perdidos" as any).insert([
        {
          tipo,
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          categoria,
          local_fato: localFato.trim(),
          contato_nome: contatoNome.trim(),
          contato_telefone: contatoTelefone.trim(),
          status: "pendente",
          usuario_id: usuarioLogadoId, // Vincula o post ao usuário se ele estiver logado
        },
      ]);

      if (error) throw error;

      toast({
        title: "Enviado com sucesso!",
        description: "O item foi enviado para a moderação da equipe Saj Tem e será publicado em breve.",
      });

      setTitulo("");
      setDescricao("");
      setLocalFato("");
      setContatoNome("");
      setContatoTelefone("");
      setIsModalAberto(false);
      buscarItens();
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Ocorreu um erro inesperado na conexão.",
        variant: "destructive",
      });
    } finally {
      submittingRef.current = false;
      setEnviando(false);
    }
  };

  // Função para marcar o item como resolvido diretamente pela tela
  const handleMarcarComoResolvido = async (itemId: string) => {
    if (resolvendoId || !usuarioLogadoId || activeUserRef.current !== usuarioLogadoId) return;
    setResolvendoId(itemId);
    const account = usuarioLogadoId;
    try {
      const { data: { user }, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || user?.id !== account || activeUserRef.current !== account) {
        throw new Error("Sua sessão mudou. Entre novamente para atualizar esta ocorrência.");
      }
      const { data: updated, error } = await supabase
        .from("achados_perdidos" as any)
        .update({ status: "resolvido" } as any)
        .eq("id", itemId)
        .eq("usuario_id", usuarioLogadoId)
        .eq("status", "aprovado")
        .select("id")
        .maybeSingle();

      if (activeUserRef.current !== account) return;
      if (error) throw error;
      if (!updated) throw new Error("Ocorrência já resolvida, inexistente ou sem permissão.");

      toast({
        title: "Caso resolvido!",
        description: "Parabéns! O item foi marcado como resolvido e atualizado na plataforma.",
      });

      buscarItens();
    } catch (error: any) {
      if (activeUserRef.current !== account) return;
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível alterar o status do item.",
        variant: "destructive",
      });
    } finally {
      setResolvendoId(null);
    }
  };

  const itensFiltrados = itens.filter((item) => {
    // Se a aba for "meus", o filtro por tipo já foi feito na query do banco. Caso contrário, aplica a separação por tipo
    const correspondeTipo = filtroTipo === "todos" || filtroTipo === "meus" || item.tipo === filtroTipo;
    const correspondeBusca =
      item.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      item.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      item.local_fato.toLowerCase().includes(busca.toLowerCase());
    return correspondeTipo && correspondeBusca;
  });

  return (
    <div className="w-full min-h-screen bg-[#0F0A19] text-white py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Luzes de Fundo de Estilo Tech Glow */}
      <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-5%] w-[450px] h-[450px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Banner de cabeçalho premium */}
        <div className="bg-[#150F22]/80 border border-purple-900/40 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md mb-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[300px] h-[100%] bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />
          
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-purple-400" /> Utilidade Pública • SAJ
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mt-4 mb-3 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Achados e Perdidos
            </h1>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Perdeu ou encontrou algo em Santo Antônio de Jesus? Use a força do portal para espalhar o aviso! Registre os detalhes abaixo e ajude a nossa comunidade local.
            </p>
            
            <button
              ref={openButtonRef}
              type="button"
              onClick={() => setIsModalAberto(true)}
              className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 text-white font-extrabold px-6 py-3.5 rounded-xl hover:opacity-95 shadow-lg shadow-purple-600/20 active:scale-[0.98] transition-all text-sm group"
            >
              <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" /> Notificar Objeto / Pet
            </button>
          </div>
        </div>

        {/* Painel de busca e filtros */}
        <div className="bg-[#150F22]/60 border border-purple-900/30 rounded-2xl p-4 backdrop-blur-sm shadow-xl mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400/80" />
            <input
              type="text"
              placeholder="Buscar documentos, chaves, bolsas, animais..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0F0A19]/80 border border-purple-900/40 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all"
            />
          </div>

          {/* AJUSTADO: Mudado de overflow-x-auto para flex-wrap e removida a rolagem padrão horizontal */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto items-center justify-start md:justify-end">
            <button
              onClick={() => setFiltroTipo("todos")}
              className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all shrink-0 ${
                filtroTipo === "todos"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/10"
                  : "bg-[#0F0A19] text-gray-400 border border-purple-900/30 hover:text-white hover:border-purple-800"
              }`}
            >
              Todos os Itens
            </button>
            <button
              onClick={() => setFiltroTipo("perdido")}
              className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all border shrink-0 ${
                filtroTipo === "perdido"
                  ? "bg-red-500/20 text-red-400 border-red-500/40 shadow-sm"
                  : "bg-[#0F0A19] text-gray-400 border border-purple-900/30 hover:text-red-400 hover:border-red-900/40"
              }`}
            >
              Objetos Perdidos 🔍
            </button>
            <button
              onClick={() => setFiltroTipo("encontrado")}
              className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all border shrink-0 ${
                filtroTipo === "encontrado"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm"
                  : "bg-[#0F0A19] text-gray-400 border border-purple-900/30 hover:text-emerald-400 hover:border-emerald-900/40"
              }`}
            >
              Encontrados 🎉
            </button>

            {/* Nova Aba de controle exibida condicionalmente se houver uma sessão logada ativa */}
            {usuarioLogadoId && (
              <button
                onClick={() => setFiltroTipo("meus")}
                className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all border shrink-0 flex items-center gap-1.5 ${
                  filtroTipo === "meus"
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm"
                    : "bg-[#0F0A19] text-gray-400 border border-purple-900/30 hover:text-purple-300 hover:border-purple-900/40"
                }`}
              >
                <User className="h-3.5 w-3.5" /> Minhas Postagens
              </button>
            )}
          </div>
        </div>

        {/* Listagem principal */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-9 h-9 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-purple-300 font-medium tracking-wide">Sincronizando com os servidores de SAJ...</span>
          </div>
        ) : loadError ? (
          <div role="alert" className="rounded-2xl border border-red-500/30 bg-[#150F22] p-8 text-center space-y-3">
            <p className="font-semibold">Não foi possível carregar as ocorrências.</p>
            <button type="button" onClick={() => { void buscarItens(); }} className="rounded-xl bg-purple-600 px-5 py-3 font-bold">Tentar novamente</button>
          </div>
        ) : itensFiltrados.length === 0 ? (
          <div className="bg-[#150F22]/40 border border-purple-900/20 rounded-2xl p-16 text-center max-w-xl mx-auto backdrop-blur-sm">
            <AlertCircle className="h-12 w-12 text-purple-900 mx-auto mb-4" />
            <h3 className="font-bold text-gray-200 text-base mb-1">Nenhum registro ativo</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Nenhum item pendente ou publicado se enquadra nos termos pesquisados em Santo Antônio de Jesus no momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itensFiltrados.map((item) => (
              <div
                key={item.id}
                className="bg-[#150F22]/50 border border-purple-900/30 rounded-2xl p-5 shadow-lg hover:border-purple-800/60 hover:bg-[#150F22]/70 transition-all relative flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                          item.tipo === "perdido" 
                            ? "bg-red-500/10 text-red-400 border-red-500/20" 
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        {item.tipo === "perdido" ? "Perdido" : "Encontrado"}
                      </span>
                      
                      {/* Badge informativo de aprovação para o dono saber se o post está ativo */}
                      {filtroTipo === "meus" && item.status === "pendente" && (
                        <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-2.5 py-1 rounded-full uppercase font-black tracking-widest">
                          Pendente
                        </span>
                      )}
                    </div>
                    
                    <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1 bg-purple-950/40 border border-purple-900/40 px-2 py-0.5 rounded-lg">
                      <Tag className="h-3 w-3 text-purple-400" /> {item.categoria}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-white text-base leading-tight mb-2 group-hover:text-purple-300 transition-colors">
                    {item.titulo}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-5 whitespace-pre-line">
                    {item.descricao}
                  </p>
                </div>

                <div className="border-t border-purple-950/80 pt-4 mt-2 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-xs text-gray-400">
                    <MapPin className="h-4 w-4 text-purple-500 shrink-0" />
                    <span className="truncate">Visto em: <strong className="text-gray-200">{item.local_fato}</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-gray-500">
                    <Calendar className="h-4 w-4 text-purple-900 shrink-0" />
                    <span>Publicação: {new Date(item.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>

                  {/* AÇÕES DE CONTROLE DE STATUS DO PROPRIETÁRIO OU EXIBIÇÃO DE CONTATO PÚBLICO */}
                  {item.status === "resolvido" ? (
                    <div className="w-full bg-[#0F0A19] text-gray-500 border border-purple-950/80 font-black text-xs p-3 rounded-xl flex items-center justify-center gap-1.5 text-center uppercase tracking-wider">
                      <CheckCircle2 className="h-4 w-4 text-purple-900" /> Item Devolvido / Resolvido
                    </div>
                  ) : usuarioLogadoId && item.usuario_id === usuarioLogadoId ? (
                    <button
                      onClick={() => { void handleMarcarComoResolvido(item.id); }}
                      disabled={!!resolvendoId || item.status !== "aprovado"}
                      aria-label={`Marcar ${item.titulo} como resolvido`}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs p-3 rounded-xl flex items-center justify-center gap-1.5 hover:shadow-md hover:shadow-emerald-600/10 hover:opacity-95 active:scale-[0.99] transition-all text-center uppercase tracking-wider mt-2"
                    >
                      <Check className="h-4 w-4" /> Marcar como Achado / Entregue
                    </button>
                  ) : getJobApplicationHref("whatsapp", item.contato_telefone) ? (
                    <a
                      href={getJobApplicationHref("whatsapp", item.contato_telefone)!}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs p-3 rounded-xl flex items-center justify-center gap-1.5 hover:shadow-md hover:shadow-purple-600/10 hover:opacity-95 active:scale-[0.99] transition-all text-center uppercase tracking-wider mt-2"
                    >
                      <Phone className="h-3.5 w-3.5" /> Entrar em Contato ({item.contato_nome})
                    </a>
                  ) : (
                    <p className="rounded-xl border border-purple-900/40 p-3 text-center text-xs text-gray-400">Contato indisponível</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de cadastro premium */}
        {isModalAberto && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div ref={modalRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Notificar ocorrência" className="bg-[#150F22] border border-purple-900/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-purple-950/50 animate-in fade-in zoom-in-95 duration-150 text-white">
              <div className="bg-[#0F0A19] border-b border-purple-950/80 px-5 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <h2 className="font-black text-sm uppercase tracking-wider">Notificar Nova Ocorrência</h2>
                </div>
                <button
                  onClick={() => { if (!enviando) setIsModalAberto(false); }}
                  disabled={enviando}
                  aria-label="Fechar cadastro"
                  className="p-1 rounded-lg bg-purple-950/40 text-gray-400 hover:text-white hover:bg-purple-900/40 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCadastrarItem} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#0F0A19] border border-purple-950/60 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTipo("perdido")}
                    className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                      tipo === "perdido"
                        ? "bg-gradient-to-r from-red-600/20 to-red-500/10 text-red-400 border border-red-500/30 shadow-inner"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Perdi um Item 🔍
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo("encontrado")}
                    className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                      tipo === "encontrado"
                        ? "bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-inner"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    Achei um Item 🎉
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-purple-300 mb-1.5">O que foi?</label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={160}
                    placeholder="Ex: Chave de carro Fiat, Cachorro Poodle branco..."
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0F0A19] border border-purple-900/40 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-gray-200"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-purple-300 mb-1.5">Categoria</label>
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#0F0A19] border border-purple-900/40 rounded-xl text-sm focus:outline-none focus:border-purple-500 text-gray-300"
                    >
                      <option value="Documentos">Documentos</option>
                      <option value="Animais de Estimação">Animais de Estimação</option>
                      <option value="Chaves">Chaves</option>
                      <option value="Carteiras / Bolsas">Carteiras / Bolsas</option>
                      <option value="Eletrônicos (Celular, Fone)">Eletrônicos</option>
                      <option value="Outros">Outros Objetos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-purple-300 mb-1.5">Onde em SAJ?</label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={160}
                      placeholder="Ex: No São Benedito / Centro"
                      value={localFato}
                      onChange={(e) => setLocalFato(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#0F0A19] border border-purple-900/40 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-gray-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-purple-300 mb-1.5">Descrição/Detalhes</label>
                  <textarea
                    rows={3}
                    required
                    minLength={10}
                    maxLength={4000}
                    placeholder="Descreva características marcantes, cores ou marcas do objeto ou animal encontrado..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0F0A19] border border-purple-900/40 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-gray-200 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-purple-950/80 pt-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-purple-300 mb-1.5">Seu Nome</label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={120}
                      placeholder="Quem responderá"
                      value={contatoNome}
                      onChange={(e) => setContatoNome(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#0F0A19] border border-purple-900/40 rounded-xl text-sm focus:outline-none focus:border-purple-500 text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-purple-300 mb-1.5">WhatsApp para Contato</label>
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      maxLength={25}
                      required
                      placeholder="Ex: 75999999999"
                      value={contatoTelefone}
                      onChange={(e) => setContatoTelefone(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#0F0A19] border border-purple-900/40 rounded-xl text-sm focus:outline-none focus:border-purple-500 text-gray-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl hover:opacity-95 shadow-lg shadow-purple-600/20 disabled:opacity-50 mt-2 transition-all"
                >
                  {enviando ? "Processando Registro..." : "Enviar para Moderação"}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AchadosPerdidos;
