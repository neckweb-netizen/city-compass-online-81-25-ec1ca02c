
import { LocalsList } from '@/components/locais/LocalsList';
import { BannerSection } from '@/components/home/BannerSection';
import { SearchContent } from '@/components/search/SearchContent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Search } from 'lucide-react';

export const Locais = () => {
  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-5 sm:py-8 lg:px-8">
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="mb-3 text-3xl font-bold leading-tight text-foreground sm:mb-4 sm:text-4xl">Explorar Locais</h1>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Explore todos os locais cadastrados na plataforma e encontre exatamente o que você procura
          </p>
        </div>

        {/* Banner publicitário para seção locais */}
        <BannerSection secao="locais" />

        <Tabs defaultValue="todas" className="w-full">
          <TabsList className="mb-6 grid h-auto w-full grid-cols-2 p-1 sm:mb-8">
            <TabsTrigger value="todas" className="min-w-0 gap-1.5 px-2 py-2.5 text-xs sm:gap-2 sm:text-sm">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">Todos os Locais</span>
            </TabsTrigger>
            <TabsTrigger value="buscar" className="min-w-0 gap-1.5 px-2 py-2.5 text-xs sm:gap-2 sm:text-sm">
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate">Busca Avançada</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="todas">
            <LocalsList title="Locais Disponíveis" />
          </TabsContent>
          
          <TabsContent value="buscar">
            <SearchContent />
          </TabsContent>
        </Tabs>
      </div>
  );
};

export default Locais;
