import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/ui/share-button';
import { 
  Calendar, 
  MapPin, 
  Building2, 
  Clock, 
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EventoDetailContentProps {
  eventoId?: string;
}

export const EventoDetailContent = ({ eventoId }: EventoDetailContentProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: evento, isLoading } = useQuery({
    queryKey: ['evento-detail', eventoId],
    queryFn: async () => {
      if (!eventoId) throw new Error('ID do evento é obrigatório');
      
      const { data, error } = await supabase
        .from('eventos')
        .select(`
          *,
          categorias(nome, slug),
          empresas(nome, slug, endereco, telefone),
          cidades(nome, estado)
        `)
        .eq('id', eventoId)
        .eq('ativo', true)
        .eq('status_aprovacao', 'aprovado')
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!eventoId,
  });


  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando evento...</p>
        </div>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Evento não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            O evento que você está procurando não existe ou foi removido.
          </p>
          <Button onClick={() => navigate('/eventos')}>
            Voltar para Eventos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* Hero Section Completamente Nova */}
      <div className="relative">
        {evento.imagem_banner ? (
          <div className="relative h-[60vh] overflow-hidden rounded-b-3xl shadow-2xl">
            <img
              src={evento.imagem_banner}
              alt={evento.titulo}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            
            {/* Floating Navigation */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => navigate('/eventos')}
                className="flex items-center gap-2 bg-white/90 hover:bg-white text-black backdrop-blur-lg border-0 shadow-lg rounded-full px-4 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              <ShareButton 
                url={window.location.href}
                title={evento.titulo}
                description={evento.descricao || `Confira o evento ${evento.titulo}`}
                variant="secondary"
                size="sm"
                className="bg-white/90 hover:bg-white text-black backdrop-blur-lg border-0 shadow-lg rounded-full px-4 py-2"
              />
            </div>

            {/* Content Over Image */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="container mx-auto max-w-7xl">
                <div className="flex flex-wrap gap-3 mb-6">
                  {evento.categorias && (
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-4 py-2 text-sm font-semibold rounded-full shadow-lg">
                      {evento.categorias.nome}
                    </Badge>
                  )}
                  {evento.cidades && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 px-4 py-2 text-sm font-semibold rounded-full shadow-lg">
                      📍 {evento.cidades.nome} - {evento.cidades.estado}
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white mb-4 drop-shadow-2xl leading-tight">
                  {evento.titulo}
                </h1>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative h-[60vh] bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 rounded-b-3xl shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI0Ii8+PC9nPjwvZz48L3N2Zz4=')]" />
            
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => navigate('/eventos')}
                className="flex items-center gap-2 bg-white/90 hover:bg-white text-black backdrop-blur-lg border-0 shadow-lg rounded-full px-4 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              <ShareButton 
                url={window.location.href}
                title={evento.titulo}
                description={evento.descricao || `Confira o evento ${evento.titulo}`}
                variant="secondary"
                size="sm"
                className="bg-white/90 hover:bg-white text-black backdrop-blur-lg border-0 shadow-lg rounded-full px-4 py-2"
              />
            </div>

            <div className="absolute inset-0 flex items-center justify-center text-center p-6">
              <div>
                <div className="flex flex-wrap gap-3 mb-6 justify-center">
                  {evento.categorias && (
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-lg px-4 py-2 text-sm font-semibold rounded-full">
                      {evento.categorias.nome}
                    </Badge>
                  )}
                  {evento.cidades && (
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-lg px-4 py-2 text-sm font-semibold rounded-full">
                      📍 {evento.cidades.nome} - {evento.cidades.estado}
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white mb-4 drop-shadow-2xl leading-tight">
                  {evento.titulo}
                </h1>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Section Completamente Redesenhada */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description Card com novo design */}
            {evento.descricao && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border-0 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <div className="w-6 h-6 bg-white rounded-lg" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sobre o Evento</h2>
                </div>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">
                    {evento.descricao}
                  </p>
                </div>
              </div>
            )}

            {/* Company Card com novo design */}
            {evento.empresas && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border-0 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Empresa Organizadora</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{evento.empresas.nome}</h3>
                    
                    <div className="space-y-3">
                      {evento.empresas.endereco && (
                        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-700 rounded-2xl">
                          <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-xl flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {evento.empresas.endereco}
                          </p>
                        </div>
                      )}
                      
                      {evento.empresas.telefone && (
                        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-700 rounded-2xl">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                          </div>
                          <p className="text-gray-600 dark:text-gray-300">
                            {evento.empresas.telefone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => navigate(`/local/${evento.empresas.slug}`)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 rounded-2xl py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Ver Perfil da Empresa
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Redesenhada */}
          <div className="space-y-8">
            {/* Date Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 border-0 sticky top-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Data e Hora</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">INÍCIO</p>
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-2xl border border-orange-200 dark:border-orange-800">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatDateTime(evento.data_inicio)}
                    </p>
                  </div>
                </div>
                
                {evento.data_fim && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">TÉRMINO</p>
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-800">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatDateTime(evento.data_fim)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Location Card */}
            {(evento.local || evento.endereco) && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 border-0">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Local</h3>
                </div>
                
                <div className="space-y-4">
                  {evento.local && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-2xl border border-green-200 dark:border-green-800">
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white">{evento.local}</h4>
                    </div>
                  )}
                  
                  {evento.endereco && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">ENDEREÇO</p>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {evento.endereco}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Info Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 border-0">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Informações</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Criado em {formatDate(evento.criado_em)}</span>
                </div>
                {evento.atualizado_em !== evento.criado_em && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-xl">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Atualizado em {formatDate(evento.atualizado_em)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};