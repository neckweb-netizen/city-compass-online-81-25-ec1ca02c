
import { LocalsList } from '@/components/locais/LocalsList';
import { BannerSection } from '@/components/home/BannerSection';
import { SearchContent } from '@/components/search/SearchContent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Search } from 'lucide-react';

export const Locais = () => {
  return (
    <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Explorar Locais</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore todos os locais cadastrados na plataforma e encontre exatamente o que você procura
          </p>
        </div>

        {/* Banner publicitário para seção locais */}
        <BannerSection secao="locais" />

        <Tabs defaultValue="todas" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="todas" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Todos os Locais
            </TabsTrigger>
            <TabsTrigger value="buscar" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Busca Avançada
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
