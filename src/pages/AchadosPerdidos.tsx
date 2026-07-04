import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, Phone, Plus, AlertCircle, CheckCircle2, Filter, Tag, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
      setEnviando(false);
      const { error } = await supabase.from("achados_perdidos" as any).insert([
        {
          tipo,
          titulo,
          descricao,
          categoria,
          local_fato: localFato,
          contato_nome: contatoNome,
          contato_telefone: contatoTelefone,
          status: "pendente", // Entra como pendente para moderação da equipe Saj Tem
        },
      ]);

      if (error) throw error;

      toast({
        title: "Cadastro realizado!",
        description: "Obrigado! O item passará por uma rápida moderação antes de ser listado no portal.",
      });

      // Reseta o formulário e fecha o modal
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
    <div className="w-full min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Banner de cabeçalho */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-10 shadow-xl shadow-blue-900/10 mb-8 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="bg-white/20 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-sm">
              Utilidade Pública • SAJ
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mt-3 mb-2">
              Achados e Perdidos
            </h1>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              Perdeu ou encontrou algo em Santo Antônio de Jesus? Cadastre os dados no nosso painel de utilidade pública para ajudar a comunidade a localizar.
            </p>
            <button
              onClick={() => setIsModalAberto(true)}
              className="mt-6 inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-5 py-3 rounded-xl hover:bg-blue-50 transition-all text-sm shadow-md"
            >
              <Plus className="h-4 w-4" /> Cadastrar um Item
            </button>
          </div>
          <div className="absolute right-[-5%] bottom-[-20%] text-white/5 font-black text-9xl pointer-events-none hidden lg:block">
            SAJ
          </div>
        </div>

        {/* Barra de filtros e pesquisa */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar por documentos, chaves, pet, locais..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setFiltroTipo("todos")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filtroTipo === "todos" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Ver Todos
            </button>
            <button
              onClick={() => setFiltroTipo("perdido")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filtroTipo === "perdido" ? "bg-red-500 text-white" : "bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              Perdidos 🔍
            </button>
            <button
              onClick={() => setFiltroTipo("encontrado")}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filtroTipo === "encontrado" ? "bg-green-600 text-white" : "bg-green-50 text-green-600 hover:bg-green-100"
              }`}
            >
              Encontrados 🎉
            </button>
          </div>
        </div>

        {/* Listagem de itens em grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500">Sincronizando registros da região...</span>
          </div>
        ) : itensFiltrados.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center max-w-xl mx-auto">
            <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-gray-700 text-base mb-1">Nenhum registro encontrado</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Não existem itens que coincidam com os seus filtros ou busca neste momento em Santo Antônio de Jesus.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itensFiltrados.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        item.tipo === "perdido" ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-600 border border-green-100"
                      }`}
                    >
                      {item.tipo === "perdido" ? "Perdido" : "Encontrado"}
                    </span>
                    <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                      <Tag className="h-3 w-3" /> {item.categoria}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-800 text-base leading-tight mb-2">
                    {item.titulo}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed mb-4 whitespace-pre-line">
                    {item.descricao}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">Local: <strong>{item.local_fato}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span>Postado em: {new Date(item.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                  {item.status === "resolvido" ? (
                    <div className="bg-gray-50 text-gray-500 font-bold text-xs p-2 rounded-xl flex items-center justify-center gap-1.5 border border-gray-100 mt-2">
                      <CheckCircle2 className="h-4 w-4 text-gray-400" /> Item Devolvido ao Dono
                    </div>
                  ) : (
                    <a
                      href={`https://wa.me/55${item.contato_telefone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-gray-900 text-white font-bold text-xs p-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-gray-800 transition-colors mt-2"
                    >
                      <Phone className="h-3.5 w-3.5" /> Contatar ({item.contato_nome})
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Cadastro de Novo Item */}
        {isModalAberto && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="bg-gray-900 text-white px-5 py-4 flex justify-between items-center">
                <h2 className="font-bold text-base">Notificar Achado ou Perdido</h2>
                <button onClick={() => setIsModalAberto(false)} className="text-gray-400 hover:text-white text-xs font-bold">
                  Fechar ✕
                </button>
              </div>

              <form onSubmit={handleCadastrarItem} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTipo("perdido")}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      tipo === "perdido" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    Eu Perdi Algo 🔍
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo("encontrado")}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      tipo === "encontrado" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    Eu Encontrei Algo 🎉
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Título Resumido</label>
                  <input
                    type="text"
                    placeholder="Ex: Chave de moto Honda com chaveiro azul, RG de Fulano..."
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Categoria</label>
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-gray-50"
                    >
                      <option value="Documentos">Documentos</option>
                      <option value="Animais de Estimação">Animais de Estimação</option>
                      <option value="Chaves">Chaves</option>
                      <option value="Carteiras / Bolsas">Carteiras / Bolsas</option>
                      <option value="Eletrônicos (Celular, Fone)">Eletrônicos (Celular, Fone)</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Onde (Bairro ou Ponto em SAJ)</label>
                    <input
                      type="text"
                      placeholder="Ex: Próximo à Praça Padre Mateus"
                      value={localFato}
                      onChange={(e) => setLocalFato(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Descrição Detalhada</label>
                  <textarea
                    rows={3}
                    placeholder="Dê mais detalhes para ajudar na identificação (características particulares, marcas, cor)..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-gray-50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Seu Nome</label>
                    <input
                      type="text"
                      placeholder="Nome do contato"
                      value={contatoNome}
                      onChange={(e) => setContatoNome(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp de Contato</label>
                    <input
                      type="text"
                      placeholder="Ex: 75999999999"
                      value={contatoTelefone}
                      onChange={(e) => setContatoTelefone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-gray-50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full bg-blue-600 text-white font-bold text-sm py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2 shadow-md"
                >
                  {enviando ? "Enviando para Moderação..." : "Publicar Registro"}
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
