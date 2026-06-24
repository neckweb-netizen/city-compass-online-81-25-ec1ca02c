
import { Radio } from 'lucide-react';
import { RadioPlayer } from '@/components/ui/radio-player';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Radios() {
  const { data: radioStations, isLoading } = useQuery({
    queryKey: ['radio-stations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('empresas')
        .select(`
          *,
          categorias!inner(nome)
        `)
        .eq('categorias.nome', 'Rádios')
        .eq('ativo', true);
      
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Radio className="w-8 h-8 text-red-500" />
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Rádios</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Carregando rádios...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Radio className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Rádios</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Ouça as melhores rádios da região ao vivo
          </p>
        </div>

        {radioStations && radioStations.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {radioStations.map((station) => (
              <div key={station.id} className="space-y-3">
                <RadioPlayer 
                  radioUrl={station.link_radio || ''}
                  stationName={station.nome}
                />
                <div className="text-center px-4">
                  <h3 className="font-semibold text-sm mb-1">{station.nome}</h3>
                  <p className="text-sm text-muted-foreground">
                    {station.descricao}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Radio className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Nenhuma rádio cadastrada</h2>
            <p className="text-muted-foreground">
              Ainda não há rádios cadastradas na categoria "Rádios".
            </p>
          </div>
        )}

        <div className="mt-12 bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 text-center">
          <Radio className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Cadastre sua Rádio</h2>
          <p className="text-red-700 mb-4">
            Empresários do ramo radiofônico podem cadastrar suas rádios na plataforma.
          </p>
          <div className="text-sm text-red-600">
            🎵 Streaming ao vivo • 📱 Multiplataforma • 🎧 Divulgação gratuita
          </div>
        </div>
      </div>
    </div>
  );
}
