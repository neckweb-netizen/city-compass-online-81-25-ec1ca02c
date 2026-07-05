import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Search, Download, MapPin, Loader2, Landmark, Tag } from 'lucide-react';
import { toast } from 'sonner';

// INSIRA AQUI A SUA CHAVE GERADA NO GOOGLE CLOUD CONSOLE
const GOOGLE_MAPS_KEY = "AIzaSyCLx8QE_91chIyYdbIczKAyjpi5M7exVoc";

interface GoogleItem {
  place_id: string;
  name: string;
  formatted_address: string;
}

interface CategoriaItem {
  id: string;
  nome: string;
}

export default function GoogleImporter() {
  const [busca, setBusca] = useState('');
  const [locais, setLocais] = useState<GoogleItem[]>([]);
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<Record<string, string>>({});
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [importandoId, setImportingId] = useState<string | null>(null);

  // Busca todas as categorias existentes do banco de dados na inicialização do painel
  useEffect(() => {
    const buscarCategoriasSistema = async () => {
      try {
        const { data, error } = await supabase
          .from('categorias')
          .select('id, nome')
          .order('nome', { ascending: true });
        
        if (error) throw error;
        if (data) setCategorias(data);
      } catch (err: any) {
        console.error('Erro ao listar categorias do sistema:', err);
      }
    };
    buscarCategoriasSistema();
  }, []);

  const executarBusca = async () => {
    if (!busca.trim()) return;
    setCarregandoBusca(true);
    setLocais([]);
    
    try {
      const { data, error } = await supabase.rpc('buscar_locais_google', {
        busca_termo: busca,
        google_key: GOOGLE_MAPS_KEY
      });

      if (error) throw error;
      
      const dadosBrutos = typeof data === 'string' ? JSON.parse(data) : data;
      
      const googleStatus = dadosBrutos?.status || (dadosBrutos?.content ? JSON.parse(dadosBrutos.content)?.status : null);
      const googleErrorMessage = dadosBrutos?.error_message || (dadosBrutos?.content ? JSON.parse(dadosBrutos.content)?.error_message : null);

      if (googleStatus && googleStatus !== 'OK' && googleStatus !== 'ZERO_RESULTS') {
        toast.error(`Erro do Google Maps (${googleStatus}): ${googleErrorMessage || 'Verifique o faturamento ou restrições da chave.'}`);
        return;
      }

      const listaResultados = dadosBrutos?.results || (dadosBrutos?.content ? JSON.parse(dadosBrutos.content)?.results : []);

      if (!listaResultados || listaResultados.length === 0) {
        toast.info('Nenhum estabelecimento encontrado para este termo de busca.');
        return;
      }

      const resultadosMapped = listaResultados.map((item: any) => ({
        place_id: item.place_id,
        name: item.name,
        formatted_address: item.formatted_address
      }));

      setLocais(resultadosMapped);
      
      // Define a primeira categoria como padrão selecionada para todos os resultados listados
      if (categorias.length > 0) {
        const defaultMapping: Record<string, string> = {};
        resultadosMapped.forEach((item: GoogleItem) => {
          defaultMapping[item.place_id] = categorias[0].id;
        });
        setCategoriasSelecionadas(defaultMapping);
      }

      toast.success(`${resultadosMapped.length} locais encontrados no Google Maps!`);
    } catch (err: any) {
      console.error('Erro na requisição RPC:', err);
      toast.error('Erro ao pesquisar no Guia: ' + err.message);
    } finally {
      setCarregandoBusca(false);
    }
  };

  const handleMudarCategoriaCard = (placeId: string, categoriaId: string) => {
    setCategoriasSelecionadas(prev => ({
      ...prev,
      [placeId]: categoriaId
    }));
  };

  const executarImportacao = async (placeId: string) => {
    const categoriaDefinidaId = categoriasSelecionadas[placeId];
    
    if (!categoriaDefinidaId) {
      toast.warning('Por favor, selecione uma categoria válida antes de importar.');
      return;
    }

    setImportingId(placeId);
    try {
      // Dispara a rotina SQL enviando a chave estrangeira da categoria escolhida pelo admin
      const { data, error } = await supabase.rpc('importar_detalhes_google', {
        p_place_id: placeId,
        google_key: GOOGLE_MAPS_KEY,
        p_categoria_id: categoriaDefinidaId
      });

      if (error) throw error;

      const retornoLimpo = typeof data === 'string' ? JSON.parse(data) : data;

      toast.success(`"${retornoLimpo?.nome || 'Estabelecimento'}" importado e cadastrado com sucesso!`);
      
      setLocais(prev => prev.filter(item => item.place_id !== placeId));
    } catch (err: any) {
      toast.error('Falha ao importar dados: ' + err.message);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-2">
        <Landmark className="w-7 h-7 text-purple-500" />
        <h1 className="text-3xl font-bold text-white">Painel de Importação Automática</h1>
      </div>

      <Card className="bg-[#221A32] border-purple-950/40 text-white shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-purple-400" />
            Extrair do Google Maps
          </CardTitle>
          <CardDescription className="text-gray-400">
            Busque o nicho + a sua cidade para capturar Nome, Endereço, Site, Telefone e Foto padrão de uma vez só.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: Clínicas odontológicas em Santo Antônio de Jesus..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="bg-[#0F0B15] border-purple-900/60 text-white placeholder:text-gray-500 focus-visible:ring-purple-500"
              onKeyDown={(e) => e.key === 'Enter' && executarBusca()}
            />
            <Button onClick={executarBusca} disabled={carregandoBusca} className="bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors px-6">
              {carregandoBusca ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pesquisar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {locais.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 px-1 font-medium">Resultados encontrados no mapa:</p>
          {locais.map((local) => (
            <div key={local.place_id} className="p-4 bg-[#110D1A] border border-purple-950/40 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-purple-900/50 transition-all shadow-md">
              <div className="space-y-1 flex-1">
                <h4 className="font-semibold text-white text-sm leading-tight">{local.name}</h4>
                <p className="text-gray-400 text-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  {local.formatted_address}
                </p>
              </div>

              {/* Controles de Seleção de Categoria e Importação por Item */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 bg-[#0F0B15] px-2.5 py-1.5 rounded-lg border border-purple-900/40">
                  <Tag className="w-3.5 h-3.5 text-purple-400" />
                  <select
                    value={categoriasSelecionadas[local.place_id] || ''}
                    onChange={(e) => handleMudarCategoriaCard(local.place_id, e.target.value)}
                    className="bg-transparent border-0 text-xs text-white focus:ring-0 cursor-pointer min-w-[140px] outline-none"
                  >
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-[#110D1A] text-white text-xs">
                        {cat.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  size="sm"
                  onClick={() => executarImportacao(local.place_id)}
                  disabled={importandoId === local.place_id}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-sm transition-all text-xs h-8"
                >
                  {importandoId === local.place_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 mr-1.5" /> Importar para o Guia
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
