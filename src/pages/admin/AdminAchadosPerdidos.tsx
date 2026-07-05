import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, AlertCircle, Trash2, ShieldCheck, Tag, MapPin, Eye, Calendar, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ItemOcorrência {
  id: string;
  tipo: "perdido" | "encontrado";
  titulo: string;
  descricao: string;
  categoria: string;
  local_fato: string;
  contato_nome: string;
  contato_telefone: string;
  status: "pendente" | "aprovado" | "resolvido" | "rejeitado";
  created_at: string;
}

const AdminAchadosPerdidos = () => {
  const { toast } = useToast();
  const [itens, setItens] = useState<ItemOcorrência[]>([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<"pendentes" | "ativos">("pendentes");

  const carregarOcorrencias = async () => {
    try {
      setLoading(true);
      
      // Realiza a chamada direta trazendo todas as linhas gravadas na tabela
      const { data, error } = await supabase
        .from("achados_perdidos" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Filtra localmente de forma resiliente baseando-se no estado atual das abas
      const dadosFiltrados = (data || []).filter((item: any) => {
        const statusNormalizado = item.status ? String(item.status).toLowerCase().trim() : "pendente";
        if (abaAtiva === "pendentes") {
          return statusNormalizado === "pendente" || statusNormalizado === "rejeitado" || statusNormalizado === "";
        } else {
          return statusNormalizado === "aprovado" || statusNormalizado === "resolvido";
        }
      });

      setItens(dadosFiltrados);
    } catch (error: any) {
      console.error("Erro ao carregar dados no admin:", error);
      toast({
        title: "Erro de sincronização",
        description: "Não foi possível carregar os dados de achados e perdidos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarOcorrencias();
  }, [abaAtiva]);

  const alterarStatus = async (id: string, novoStatus: "aprovado" | "resolvido" | "rejeitado") => {
    try {
      const { error } = await supabase
        .from("achados_perdidos" as any)
        .update({ status: novoStatus } as any)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status Atualizado",
        description: `Ocorrência movida para o estado de [${novoStatus}] com sucesso!`,
      });

      setItens(itens.filter((item) => item.id !== id));
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Erro de conexão com o banco de dados.",
        variant: "destructive",
      });
    }
  };

  const deletarRegistro = async (id: string) => {
    if (!window.confirm("Tem certeza absoluta que deseja deletar permanentemente este registro do sistema?")) return;
    
    try {
      const { error } = await supabase
        .from("achados_perdidos" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Registro Removido",
        description: "O item foi apagado permanentemente do banco de dados.",
      });

      setItens(itens.filter((item) => item.id !== id));
    } catch (error: any) {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0F0A19] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Topo informativo */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-purple-950/60 pb-5">
          <div>
            <div className="flex items-center gap-2 text-purple-400 text-xs font-black tracking-wider uppercase mb-1">
              <ShieldCheck className="h-4 w-4" /> Painel de Controle Admin Geral
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Moderação: Achados e Perdidos
            </h1>
          </div>
          
          <button
            onClick={carregarOcorrencias}
            className="flex items-center gap-2 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-900/40 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Atualizar Painel
          </button>
        </div>

        {/* Abas Seletoras de Estado */}
        <div className="flex border-b border-purple-950/40 p-1 bg-[#150F22]/40 max-w-md rounded-xl border border-purple-900/20">
          <button
            onClick={() => setAbaAtiva("pendentes")}
            className={`flex-1 py-2.5 text-xs font-black tracking-wider uppercase rounded-lg transition-all ${
              abaAtiva === "pendentes"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Aguardando Moderação
          </button>
          <button
            onClick={() => setAbaAtiva("ativos")}
            className={`flex-1 py-2.5 text-xs font-black tracking-wider uppercase rounded-lg transition-all ${
              abaAtiva === "ativos"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/10"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Publicados no Portal
          </button>
        </div>

        {/* Lista de Registros */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-purple-400 font-medium">Buscando ocorrências ativas...</span>
          </div>
        ) : itens.length === 0 ? (
          <div className="bg-[#150F22]/30 border border-purple-900/20 rounded-2xl p-16 text-center max-w-xl mx-auto">
            <AlertCircle className="h-10 w-10 text-purple-900 mx-auto mb-3" />
            <h3 className="font-bold text-gray-300 text-base mb-1">Nenhum item nesta lista</h3>
            <p className="text-xs text-gray-500">
              {abaAtiva === "pendentes" 
                ? "Nenhum morador de SAJ submeteu novos itens para análise por enquanto." 
                : "Não há itens publicados ou ativos listados no portal no momento."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {itens.map((item) => (
              <div
                key={item.id}
                className="bg-[#150F22]/50 border border-purple-900/30 rounded-2xl p-5 shadow-md flex flex-col lg:flex-row justify-between gap-5 group"
              >
                <div className="space-y-3 flex-grow max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2">
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
                      <Tag className="h-3 w-3 text-purple-400" /> {item.categoria || "Geral"}
                    </span>
                    <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {new Date(item.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    {item.status === "resolvido" && (
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-black tracking-widest uppercase px-2.5 py-1 rounded-full">
                        Resolvido / Entregue
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-white text-base leading-tight mb-1">
                      {item.titulo}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line">
                      {item.descricao}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0F0A19]/50 border border-purple-950/60 rounded-xl p-3 text-xs text-gray-400">
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                      <span>Local: <strong className="text-gray-200">{item.local_fato || "Não Informado"}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-purple-400 font-bold uppercase tracking-wider text-[10px]">Autor:</span>
                      <span className="text-gray-200 font-semibold">{item.contato_nome || "Anônimo"}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-purple-400 font-bold uppercase tracking-wider text-[10px]">Zap:</span>
                      {item.contato_telefone ? (
                        <a href={`https://wa.me/55${item.contato_telefone.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" className="text-purple-400 font-bold hover:underline">
                          {item.contato_telefone}
                        </a>
                      ) : (
                        <span>Sem Telefone</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bloco de Botões de Ações rápidas de Moderação */}
                <div className="flex lg:flex-col justify-end items-center gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-purple-950/80 pt-4 lg:pt-0 lg:pl-5">
                  {(item.status === undefined || String(item.status).toLowerCase().trim() === "pendente" || String(item.status).toLowerCase().trim() === "") && (
                    <>
                      <button
                        onClick={() => alterarStatus(item.id, "aprovado")}
                        className="flex-1 lg:w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 uppercase tracking-wider transition-all"
                      >
                        <Check className="h-4 w-4" /> Aprovar
                      </button>
                      <button
                        onClick={() => alterarStatus(item.id, "rejeitado")}
                        className="flex-1 lg:w-full bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-900/40 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 uppercase tracking-wider transition-all"
                      >
                        <X className="h-4 w-4" /> Rejeitar
                      </button>
                    </>
                  )}

                  {String(item.status).toLowerCase().trim() === "aprovado" && (
                    <button
                      onClick={() => alterarStatus(item.id, "resolvido")}
                      className="flex-1 lg:w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 uppercase tracking-wider transition-all"
                    >
                      <Check className="h-4 w-4" /> Marcar Devolvido
                    </button>
                  )}

                  <button
                    onClick={() => deletarRegistro(item.id)}
                    className="p-2.5 bg-transparent border border-purple-950 hover:bg-red-600/10 hover:border-red-900/40 text-gray-500 hover:text-red-400 rounded-xl transition-all"
                    title="Excluir do sistema"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminAchadosPerdidos;
