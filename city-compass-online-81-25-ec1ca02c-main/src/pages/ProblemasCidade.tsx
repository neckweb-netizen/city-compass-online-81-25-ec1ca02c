import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search } from 'lucide-react';
import { ProblemaCard } from '@/components/problemas/ProblemaCard';
import { ProblemaFormDialog } from '@/components/problemas/ProblemaFormDialog';
import { useProblemasCidade, useCategoriasProblema } from '@/hooks/useProblemasCidade';
import { useCidadePadrao } from '@/hooks/useCidadePadrao';
import { useAuth } from '@/hooks/useAuth';
import { AuthDialog } from '@/components/auth/AuthDialog';

const ProblemasCidade = () => {
  const { user } = useAuth();
  const { data: cidadePadrao } = useCidadePadrao();
  const { categorias } = useCategoriasProblema();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('all');
  const [ordenacao, setOrdenacao] = useState<'recentes' | 'populares' | 'resolvidos'>('recentes');
  const [statusFiltro, setStatusFiltro] = useState<string>('all');
  const [dialogAberto, setDialogAberto] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const { problemas, isLoading } = useProblemasCidade(cidadePadrao?.id, {
    categoriaId: categoriaFiltro !== 'all' ? categoriaFiltro : undefined,
    status: statusFiltro !== 'all' ? statusFiltro : undefined,
    ordenacao,
  });

  const problemasFiltrados = problemas?.filter(problema =>
    problema.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    problema.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Voz do Povo
          </h1>
          <p className="text-muted-foreground">
            Relate reclamações, vote e acompanhe soluções para melhorar nossa cidade
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar reclamações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categorias?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFiltro} onValueChange={setStatusFiltro}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="aberto">Aberto</SelectItem>
              <SelectItem value="em_analise">Em análise</SelectItem>
              <SelectItem value="resolvido">Resolvido</SelectItem>
              <SelectItem value="fechado">Fechado</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={() => {
              if (user) {
                setDialogAberto(true);
              } else {
                setAuthDialogOpen(true);
              }
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Relatar Reclamação
          </Button>
        </div>

        <Tabs value={ordenacao} onValueChange={(v) => setOrdenacao(v as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="recentes">Recentes</TabsTrigger>
            <TabsTrigger value="populares">Mais Votados</TabsTrigger>
            <TabsTrigger value="resolvidos">Resolvidos</TabsTrigger>
          </TabsList>

          <TabsContent value={ordenacao}>
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : problemasFiltrados && problemasFiltrados.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {problemasFiltrados.map((problema) => (
                  <ProblemaCard key={problema.id} problema={problema} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhuma reclamação encontrada
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <ProblemaFormDialog
          open={dialogAberto}
          onOpenChange={setDialogAberto}
        />

        <AuthDialog
          open={authDialogOpen}
          onOpenChange={setAuthDialogOpen}
        />
      </div>
  );
};

export default ProblemasCidade;
