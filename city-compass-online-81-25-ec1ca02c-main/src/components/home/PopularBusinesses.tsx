
import { useEmpresasDestaque } from '@/hooks/useEmpresas';
import { useCidadeData } from '@/hooks/useCidadePadrao';
import { LocalCard } from '@/components/locais/LocalCard';
import { NeonCard } from '@/components/ui/neon-card';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const PopularBusinesses = () => {
  const { cidade } = useCidadeData();
  const { data: empresas, isLoading } = useEmpresasDestaque(cidade?.id || '');
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Locais em Destaque</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-t-lg"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!empresas || empresas.length === 0) {
    return null;
  }

  return (
    <NeonCard className="mx-2 sm:mx-4 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Locais em Destaque</h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Os melhores locais da região</p>
        </div>
        <Button variant="outline" className="hidden md:flex">
          Ver todas
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {empresas.slice(0, 6).map((empresa) => (
          <LocalCard
            key={empresa.id}
            empresa={{
              ...empresa,
              destaque: true,
              categorias: { nome: empresa.categoria_nome },
              estatisticas: {
                media_avaliacoes: empresa.media_avaliacoes,
                total_avaliacoes: empresa.total_avaliacoes,
                total_visualizacoes: 0
              }
            }}
            onClick={() => navigate(`/locais/${empresa.id}`)}
          />
        ))}
      </div>
      
      <div className="flex justify-center mt-4 sm:mt-6 md:hidden">
        <Button variant="outline" className="w-full">
          Ver todos os locais
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </NeonCard>
  );
};
