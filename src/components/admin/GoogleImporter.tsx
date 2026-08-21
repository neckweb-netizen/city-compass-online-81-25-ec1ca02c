import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Download, Landmark, Loader2, MapPin, RefreshCw, Search, SlidersHorizontal, Tag } from 'lucide-react';
import { toast } from 'sonner';

const GOOGLE_MAPS_CATEGORIES = [
  { id: 'restaurant', nome: 'Restaurantes / Bares / Lanchonetes' },
  { id: 'dentist', nome: 'Dentistas / Clínicas Odontológicas' },
  { id: 'pharmacy', nome: 'Farmácias / Drogarias' },
  { id: 'clothing_store', nome: 'Lojas de Roupas / Moda' },
  { id: 'beauty_salon', nome: 'Salões de Beleza / Estética' },
  { id: 'supermarket', nome: 'Supermercados / Mercearias' },
  { id: 'car_repair', nome: 'Oficinas / Automotivo' },
  { id: 'hotel', nome: 'Hotéis / Pousadas' },
  { id: 'health', nome: 'Saúde / Clínicas Médicas' },
  { id: 'store', nome: 'Comércio em Geral / Lojas' },
];

interface GoogleItem {
  place_id: string;
  name: string;
  formatted_address: string;
  empresaId?: string;
  jaCadastrada?: boolean;
}

interface CategoriaItem {
  id: string;
  nome: string;
}

interface SearchResponse {
  status?: string;
  results?: GoogleItem[];
  error?: string;
  error_message?: string;
}

interface ImportResponse {
  status?: string;
  nome?: string;
  empresa?: { id?: string; nome?: string };
  error?: string;
}

const getErrorMessage = async (error: any) => {
  if (!error) return 'Erro desconhecido.';

  if (error.context instanceof Response) {
    try {
      const body = await error.context.clone().json();
      return body?.error || body?.message || error.message || 'Erro na Edge Function.';
    } catch {
      try {
        const text = await error.context.clone().text();
        if (text) return text;
      } catch {
        // sem ação
      }
    }
  }

  return error.message || String(error);
};

export default function GoogleImporter() {
  const [busca, setBusca] = useState('');
  const [googleCategoria, setGoogleCategoria] = useState(GOOGLE_MAPS_CATEGORIES[0].id);
  const [locais, setLocais] = useState<GoogleItem[]>([]);
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<Record<string, string>>({});
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [importandoId, setImportingId] = useState<string | null>(null);
  const [atualizandoTodas, setAtualizandoTodas] = useState(false);
  const [progressoAtualizacao, setProgressoAtualizacao] = useState('');

  useEffect(() => {
    const buscarCategoriasSistema = async () => {
      try {
        const { data, error } = await supabase
          .from('categorias')
          .select('id, nome')
          .order('nome', { ascending: true });

        if (error) throw error;
        setCategorias((data || []) as CategoriaItem[]);
      } catch (err) {
        console.error('Erro ao listar categorias do sistema:', err);
        toast.error('Não foi possível carregar as categorias do sistema.');
      }
    };

    void buscarCategoriasSistema();
  }, []);

  const executarBusca = async () => {
    if (carregandoBusca) return;

    setCarregandoBusca(true);
    setLocais([]);

    try {
      const labelCategoria = GOOGLE_MAPS_CATEGORIES.find((c) => c.id === googleCategoria)?.nome.split(' / ')[0] || '';
      const termoFormatado = [busca.trim(), labelCategoria, 'Santo Antônio de Jesus BA']
        .filter(Boolean)
        .join(' ');

      console.log('🔍 Busca no Google Maps:', termoFormatado);

      const { data, error } = await supabase.functions.invoke<SearchResponse>('google-places-admin', {
        body: {
          action: 'search',
          query: termoFormatado,
          googleType: googleCategoria,
        },
      });

      if (error) throw new Error(await getErrorMessage(error));
      if (!data) throw new Error('A Edge Function não retornou dados.');

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(data.error_message || data.error || `Resposta inválida: ${data.status || 'sem status'}`);
      }

      const resultadosMapped = Array.isArray(data.results) ? data.results : [];

      if (resultadosMapped.length === 0) {
        toast.info('Nenhum estabelecimento encontrado em SAJ para esses critérios.');
        return;
      }

      const placeIds = resultadosMapped.map((item) => item.place_id).filter(Boolean);
      const empresasPorPlaceId = new Map<string, { id: string; nome: string }>();
      const empresasPorNome = new Map<string, { id: string; nome: string }>();

      const normalizarNome = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

      const { data: empresasLocais, error: errorEmpresas } = await supabase
        .from('empresas')
        .select('id, nome, place_id')
        .eq('ativo', true);

      if (errorEmpresas) throw errorEmpresas;

      (empresasLocais || []).forEach((empresa: any) => {
        if (empresa.place_id) empresasPorPlaceId.set(empresa.place_id, empresa);
        empresasPorNome.set(normalizarNome(empresa.nome || ''), empresa);
      });

      if (placeIds.length > 0) {
        const { data: empresasExistentes, error: errorExistentes } = await supabase
          .from('empresas')
          .select('place_id')
          .in('place_id', placeIds);

        if (errorExistentes) {
          console.error('Erro ao verificar empresas existentes:', errorExistentes);
          throw new Error('Não foi possível verificar empresas já importadas. Confirme se a migration do place_id foi executada.');
        }

        (empresasExistentes || []).forEach((empresa: any) => {
          if (empresa.place_id && !empresasPorPlaceId.has(empresa.place_id)) empresasPorPlaceId.set(empresa.place_id, empresa);
        });
      }

      const resultadosFiltrados = resultadosMapped.map((item) => {
        const existente = empresasPorPlaceId.get(item.place_id) || empresasPorNome.get(normalizarNome(item.name));
        return { ...item, empresaId: existente?.id, jaCadastrada: Boolean(existente) };
      });

      setLocais(resultadosFiltrados);

      if (categorias.length > 0) {
        const defaultMapping: Record<string, string> = {};
        resultadosFiltrados.forEach((item) => {
          defaultMapping[item.place_id] = categorias[0].id;
        });
        setCategoriasSelecionadas(defaultMapping);
      }

      toast.success(`${resultadosFiltrados.length} locais encontrados. Os já cadastrados podem ter imagem e horários atualizados.`);
    } catch (err: any) {
      console.error('Erro ao pesquisar no Google Maps:', err);
      toast.error(`Erro ao pesquisar no Guia: ${err?.message || 'Falha desconhecida'}`);
    } finally {
      setCarregandoBusca(false);
    }
  };

  const handleMudarCategoriaCard = (placeId: string, categoriaId: string) => {
    setCategoriasSelecionadas((prev) => ({ ...prev, [placeId]: categoriaId }));
  };

  const executarImportacao = async (placeId: string, empresaId?: string) => {
    const categoriaDefinidaId = categoriasSelecionadas[placeId];

    if (!categoriaDefinidaId) {
      toast.warning('Selecione uma categoria válida antes de importar.');
      return;
    }

    setImportingId(placeId);

    try {
      const { data, error } = await supabase.functions.invoke<ImportResponse>('google-places-admin', {
        body: { action: 'import', placeId, categoryId: categoriaDefinidaId, empresaId },
      });

      if (error) throw new Error(await getErrorMessage(error));
      if (!data || data.status !== 'OK') throw new Error(data?.error || 'A importação não foi concluída.');

      const nome = data.empresa?.nome || data.nome || 'Estabelecimento';
      toast.success(empresaId ? `"${nome}" teve imagem, horários e dados atualizados!` : `"${nome}" importado para o Guia com sucesso!`);
      setLocais((prev) => prev.filter((item) => item.place_id !== placeId));
    } catch (err: any) {
      console.error('Erro ao importar estabelecimento:', err);
      toast.error(`Falha ao importar dados: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setImportingId(null);
    }
  };

  const atualizarTodasEmpresas = async () => {
    if (atualizandoTodas) return;
    if (!window.confirm('Consultar todas as empresas no Google pode consumir sua cota da API. Deseja continuar?')) return;

    setAtualizandoTodas(true);
    let cursor: string | undefined;
    let atualizadas = 0;
    let comFoto = 0;
    let ignoradas = 0;

    try {
      do {
        const { data, error } = await supabase.functions.invoke<any>('google-places-admin', {
          body: { action: 'bulk-refresh', cursor },
        });
        if (error) throw new Error(await getErrorMessage(error));
        if (!data || data.status !== 'OK') throw new Error(data?.error || 'Falha na atualização em lote.');

        atualizadas += data.updated?.length || 0;
        comFoto += data.updated?.filter((item: any) => item.photo).length || 0;
        ignoradas += data.skipped?.length || 0;
        cursor = data.nextCursor || undefined;
        setProgressoAtualizacao(`${atualizadas + ignoradas} empresas verificadas • ${comFoto} fotos encontradas`);

        if (!data.hasMore) break;
      } while (cursor);

      toast.success(`Atualização concluída: ${atualizadas} empresas atualizadas, ${comFoto} com foto e ${ignoradas} sem correspondência segura.`);
    } catch (err: any) {
      console.error('Erro na atualização geral:', err);
      toast.error(`Atualização interrompida: ${err?.message || 'Falha desconhecida'}`);
    } finally {
      setAtualizandoTodas(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div className="mb-2 flex items-center gap-2">
        <Landmark className="h-7 w-7 text-purple-500" />
        <h1 className="text-3xl font-bold text-white">Painel de Importação Automática</h1>
      </div>

      <Card className="border-emerald-900/40 bg-[#18251f] text-white">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Atualizar empresas cadastradas</p>
            <p className="text-xs text-gray-400">Busca fotos diretas, horários, endereço, telefone e site no Google Maps.</p>
            {progressoAtualizacao && <p className="mt-1 text-xs font-medium text-emerald-300">{progressoAtualizacao}</p>}
          </div>
          <Button onClick={() => void atualizarTodasEmpresas()} disabled={atualizandoTodas} className="bg-emerald-600 hover:bg-emerald-500">
            {atualizandoTodas ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {atualizandoTodas ? 'Atualizando...' : 'Buscar e atualizar todas'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-purple-950/40 bg-[#221A32] text-white shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-purple-400" />
            Extrair do Google Maps (Restrito a SAJ)
          </CardTitle>
          <CardDescription className="text-gray-400">
            Filtre por categoria do mapa e digite palavras-chave adicionais se necessário. A busca é direcionada para Santo Antônio de Jesus.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Selecione a Categoria do Google Maps
              </label>
              <select
                value={googleCategoria}
                onChange={(e) => setGoogleCategoria(e.target.value)}
                className="w-full rounded-xl border border-purple-900/60 bg-[#0F0B15] px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-purple-500"
              >
                {GOOGLE_MAPS_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#110D1A]">{cat.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-purple-300">Palavra-chave Opcional (Nome, Bairro, etc.)</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Centro, Eluz, Conveniência..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="border-purple-900/60 bg-[#0F0B15] text-white placeholder:text-gray-500 focus-visible:ring-purple-500"
                  onKeyDown={(e) => { if (e.key === 'Enter') void executarBusca(); }}
                />
                <Button
                  onClick={() => void executarBusca()}
                  disabled={carregandoBusca}
                  className="bg-purple-600 px-6 font-medium text-white transition-colors hover:bg-purple-700"
                >
                  {carregandoBusca ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pesquisar'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {locais.length > 0 && (
        <div className="space-y-3">
          <p className="px-1 text-xs font-medium text-gray-400">Resultados encontrados no mapa de SAJ:</p>

          {locais.map((local) => (
            <div
              key={local.place_id}
              className="flex flex-col justify-between gap-4 rounded-xl border border-purple-950/40 bg-[#110D1A] p-4 shadow-md transition-all hover:border-purple-900/50 md:flex-row md:items-center"
            >
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-semibold leading-tight text-white">{local.name}</h4>
                {local.jaCadastrada && <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Já cadastrada — pode atualizar</span>}
                <p className="flex items-center gap-1.5 text-xs text-gray-400">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                  {local.formatted_address}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-lg border border-purple-900/40 bg-[#0F0B15] px-2.5 py-1.5">
                  <Tag className="h-3.5 w-3.5 text-purple-400" />
                  <select
                    value={categoriasSelecionadas[local.place_id] || ''}
                    onChange={(e) => handleMudarCategoriaCard(local.place_id, e.target.value)}
                    className="min-w-[140px] cursor-pointer border-0 bg-transparent text-xs text-white outline-none focus:ring-0"
                  >
                    <option value="" disabled className="bg-[#110D1A]">Selecionar categoria</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-[#110D1A] text-xs text-white">{cat.nome}</option>
                    ))}
                  </select>
                </div>

                <Button
                  size="sm"
                  onClick={() => void executarImportacao(local.place_id, local.empresaId)}
                  disabled={importandoId === local.place_id}
                  className="h-8 bg-purple-600 text-xs font-medium text-white shadow-sm transition-all hover:bg-purple-500"
                >
                  {importandoId === local.place_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <><Download className="mr-1.5 h-3.5 w-3.5" />{local.jaCadastrada ? 'Atualizar dados e foto' : 'Importar para o Guia'}</>
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
