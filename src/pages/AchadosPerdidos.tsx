import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, Phone, Plus, AlertCircle, CheckCircle2, Tag, Calendar, Sparkles, X } from "lucide-react";
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
}

const AchadosPerdidos = () => {
  const { toast } = useToast();
  const location = useLocation();
  const [itens, setItens] = useState<ItemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [busca, setBusca] = useState<string>("");
  const [isModalAberto, setIsModalAberto] = useState(false);

  // Estados do formulário de novo cadastro
  const [tipo, setTipo] = useState<"perdido" | "encontrado">("perdido");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Documentos");
  const [localFato, setLocalFato] = useState("");
  const [contatoNome, setContatoNome] = useState("");
  const [contatoTelefone, setContatoTelefone] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Efeito para interceptar o clique do botão "+" global da BottomNavigation
  useEffect(() => {
    // Se o usuário clicou no "+" e foi redirecionado para cá, abre o modal direto
    if (location.pathname === "/achados-e-perdidos") {
      setIsModalAberto(true);
    }
  }, [location.pathname]);

  const buscarItens = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("achados_perdidos" as any)
        .select("*")
        .in("status", ["aprovado", "resolvido"])
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setItens(data || []);
    } catch (error) {
      console.error("Erro ao buscar itens de achados e perdidos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarItens();
  }, []);

  const handleCadastrarItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !descricao || !localFato || !contatoNome || !contatoTelefone) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos do formulário para podermos ajudar.",
        variant: "destructive",
      });
      return;
    }

    try {
      setEnviando(true);
      const { error } = await supabase.from("achados_perdidos" as any).insert([
        {
          tipo,
          titulo,
          descricao,
          categoria,
          local_fato: localFato,
          contato_nome: contatoNome,
          contato_telefone: contatoTelefone,
          status: "pendente",
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
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Ocorreu um erro inesperado na conexão.",
        variant: "destructive",
      });
    } finally {
      setEnviando(false);
    }
  };

  const itensFiltrados = itens.filter((item) => {
    const correspondeTipo = filtroTipo === "todos" || item.tipo === filtroTipo;
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

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFiltroTipo("todos")}
              className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${
                filtroTipo === "todos"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/10"
                  : "bg-[#0F0A19] text-gray-400 border border-purple-900/30 hover:text-white hover:border-purple-800"
              }`}
            >
              Todos os Itens
            </button>
            <button
              onClick={() => setFiltroTipo("perdido")}
              className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all border ${
                filtroTipo === "perdido"
                  ? "bg-red-500/20 text-red-400 border-red-500/40 shadow-sm"
                  : "bg-[#0F0A19] text-gray-400 border-purple-900/30 hover:text-red-400 hover:border-red-900/40"
              }`}
            >
              Objetos Perdidos 🔍
            </button>
            <button
              onClick={() => setFiltroTipo("encontrado")}
              className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all border ${
                filtroTipo === "encontrado"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm"
                  : "bg-[#0F0A19] text-gray-400 border-purple-900/30 hover:text-emerald-400 hover:border-emerald-900/40"
              }`}
            >
              Encontrados 🎉
            </button>
          </div>
        </div>

        {/* Listagem principal */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-9 h-9 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-purple-300 font-medium tracking-wide">Sincronizando com os servidores de SAJ...</span>
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
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                        item.tipo === "perdido" 
                          ? "bg-red-500/10 text-red-400 border-red-500/20" 
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      {item.tipo === "perdido" ? "Perdido" : "Encontrado"}
                    </span>
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

                  {item.status === "resolvido" ? (
                    <div className="w-full bg-[#0F0A19] text-gray-500 border border-purple-950/80 font-black text-xs p-3 rounded-xl flex items-center justify-center gap-1.5 text-center uppercase tracking-wider">
                      <CheckCircle2 className="h-4 w-4 text-purple-900" /> Item Devolvido / Resolvido
                    </div>
                  ) : (
                    <a
                      href={`https://wa.me/55${item.contato_telefone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs p-3 rounded-xl flex items-center justify-center gap-1.5 hover:shadow-md hover:shadow-purple-600/10 hover:opacity-95 active:scale-[0.99] transition-all text-center uppercase tracking-wider mt-2"
                    >
                      <Phone className="h-3.5 w-3.5" /> Entrar em Contato ({item.contato_nome})
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de cadastro premium */}
        {isModalAberto && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#150F22] border border-purple-900/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-purple-950/50 animate-in fade-in zoom-in-95 duration-150 text-white">
              <div className="bg-[#0F0A19] border-b border-purple-950/80 px-5 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <h2 className="font-black text-sm uppercase tracking-wider">Notificar Nova Ocorrência</h2>
                </div>
                <button
                  onClick={() => setIsModalAberto(false)}
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
                    placeholder="Ex: Chave de carro Fiat, Cachorro Poodle branco..."
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#0F0A19] border border-purple-900/40 rounded-xl text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-gray-200"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-purple-300 mb-1.5">Categoria</label>
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
                      placeholder="Quem responderá"
                      value={contatoNome}
                      onChange={(e) => setContatoNome(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#0F0A19] border border-purple-900/40 rounded-xl text-sm focus:outline-none focus:border-purple-500 text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-purple-300 mb-1.5">WhatsApp para Contato</label>
                    <input
                      type="text"
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
