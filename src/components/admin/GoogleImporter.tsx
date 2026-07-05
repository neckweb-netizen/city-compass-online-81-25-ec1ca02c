import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Search, Download, MapPin, Loader2, Landmark } from 'lucide-react';
import { toast } from 'sonner';

// INSIRA AQUI A SUA CHAVE GERADA NO GOOGLE CLOUD CONSOLE
const GOOGLE_MAPS_KEY = "AIzaSyCOLE_SUA_CHAVE_AQUI";

interface GoogleItem {
  place_id: string;
  name: string;
  formatted_address: string;
}

export default function GoogleImporter() {
  const [busca, setBusca] = useState('');
  const [locais, setLocais] = useState<GoogleItem[]>([]);
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [importandoId, setImportingId] = useState<string | null>(null);

  const executarBusca = async () => {
    if (!busca.trim()) return;
    setCarregandoBusca(true);
    setLocais([]); // Limpa os resultados anteriores antes de uma nova busca
    
    try {
      // Chama a função SQL criada diretamente pelo painel do Supabase
      const { data, error } = await supabase.rpc('buscar_locais_google', {
        busca_termo: busca,
        google_key: GOOGLE_MAPS_KEY
      });

      if (error) throw error;
      
      // Converte o retorno caso ele venha estruturado como string pura do Postgres
      const dadosBrutos = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Rastreia e captura a lista de resultados retornada pelo payload do Google
      const listaResultados = dadosBrutos?.results || (dadosBrutos?.content ? JSON.parse(dadosBrutos.content)?.results : []);

      if (!listaResultados || listaResultados.length === 0) {
        toast.info('Nenhum estabelecimento encontrado. Verifique os termos da busca e as restrições da sua chave no Google Cloud.');
        return;
      }

      const resultadosMapped = listaResultados.map((item: any) => ({
        place_id: item.place_id,
        name: item.name,
        formatted_address: item.formatted_address
      }));

      setLocais(resultadosMapped);
      toast.success(`${resultadosMapped.length} locais encontrados no Google Maps!`);
    } catch (err: any) {
      console.error('Erro na requisição RPC:', err);
      toast.error('Erro ao pesquisar no Google: ' + err.message);
    } finally {
      setCarregandoBusca(false);
    }
  };

  const executarImportacao = async (placeId: string) => {
    setImportingId(placeId);
    try {
      // Dispara a rotina SQL que consulta os detalhes e já insere na tabela 'empresas'
      const { data, error } = await supabase.rpc('importar_detalhes_google', {
        p_place_id: placeId,
        google_key: GOOGLE_MAPS_KEY
      });

      if (error) throw error;

      const retornoLimpo = typeof data === 'string' ? JSON.parse(data) : data;

      toast.success(`"${retornoLimpo?.nome || 'Estabelecimento'}" importado e cadastrado com sucesso!`);
      
      // Remove o item importado da lista visual para você saber que deu certo
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
            <div key={local.place_id} className="p-4 bg-[#110D1A] border border-purple-950/40 rounded-xl flex items-center justify-between gap-4 hover:border-purple-900/50 transition-all shadow-md">
              <div className="space-y-1">
                <h4 className="font-semibold text-white text-sm leading-tight">{local.name}</h4>
                <p className="text-gray-400 text-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  {local.formatted_address}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => executarImportacao(local.place_id)}
                disabled={importandoId === local.place_id}
                className="bg-purple-600 hover:bg-purple-500 text-white font-medium shrink-0 shadow-sm transition-all"
              >
                {importandoId === local.place_id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-1.5" /> Importar para o Guia
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
