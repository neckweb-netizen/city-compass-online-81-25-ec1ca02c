
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAdminCategorias } from '@/hooks/useAdminData';
import { CategoriaForm } from '@/components/admin/forms/CategoriaForm';
import { EditCategoriaForm } from '@/components/admin/forms/EditCategoriaForm';
import { DeleteCategoriaForm } from '@/components/admin/forms/DeleteCategoriaForm';
import { Tag, Image } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

export const CategoriasSection = () => {
  const { categorias, loading, toggleCategoria, refetch } = useAdminCategorias();
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Categorias</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando categorias...</p>
        </div>
      </div>
    );
  }

  const renderIcon = (categoria: any) => {
    if (!categoria.icone_url) {
      return <span className="text-xl">🏢</span>;
    }

    // Se for um emoji (caracteres Unicode) - regex expandida para cobrir mais emojis
    if (categoria.icone_url.match(/[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{FE00}-\u{FE0F}]|[\u{E0020}-\u{E007F}]|[\u{200D}]|[\u{20E3}]|[\u{2700}-\u{27BF}]|[\u{24C2}]|[\u{1F170}-\u{1F251}]/u)) {
      return <span className="text-xl">{categoria.icone_url}</span>;
    }

    // Se for uma URL
    return (
      <img 
        src={categoria.icone_url} 
        alt=""
        className="w-5 h-5 object-contain"
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.nextElementSibling?.classList.remove('hidden');
        }}
      />
    );
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'empresa':
        return 'Empresa';
      case 'evento':
        return 'Evento';
      case 'servico':
        return 'Serviços';
      default:
        return tipo;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'empresa':
        return 'bg-blue-100 text-blue-800';
      case 'evento':
        return 'bg-green-100 text-green-800';
      case 'servico':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const categoriasFiltradas = categorias.filter(categoria => {
    if (filtroTipo === 'todos') return true;
    return categoria.tipo === filtroTipo;
  });

  const contadorPorTipo = {
    empresa: categorias.filter(c => c.tipo === 'empresa').length,
    evento: categorias.filter(c => c.tipo === 'evento').length,
    servico: categorias.filter(c => c.tipo === 'servico').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Categorias</h2>
          <p className="text-muted-foreground">
            Gerencie as categorias disponíveis no sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">
            {categorias.length} categorias cadastradas
          </Badge>
          <CategoriaForm onSuccess={refetch} />
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Locais: {contadorPorTipo.empresa}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Eventos: {contadorPorTipo.evento}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Serviços: {contadorPorTipo.servico}
              </Badge>
            </div>
            
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="empresa">Locais</SelectItem>
                <SelectItem value="evento">Eventos</SelectItem>
                <SelectItem value="servico">Serviços</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categoriasFiltradas.map((categoria) => (
          <Card key={categoria.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {renderIcon(categoria)}
                  {categoria.nome}
                </CardTitle>
                <Badge variant={categoria.ativo ? 'default' : 'secondary'}>
                  {categoria.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(categoria.tipo)}`}>
                    {getTipoLabel(categoria.tipo)}
                  </span>
                  <span>•</span>
                  <span>Slug: {categoria.slug}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Image className="w-4 h-4" />
                  {categoria.icone_url ? (
                    <span>Ícone configurado</span>
                  ) : (
                    <span className="text-muted-foreground">Sem ícone</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={categoria.ativo}
                      onCheckedChange={(checked) => 
                        toggleCategoria({ id: categoria.id, ativo: checked })
                      }
                    />
                    <span className="text-sm">Categoria ativa</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {new Date(categoria.criado_em).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <EditCategoriaForm categoria={categoria} onSuccess={refetch} />
                  <DeleteCategoriaForm categoria={categoria} onSuccess={refetch} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {categoriasFiltradas.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {filtroTipo === 'todos' 
                  ? 'Nenhuma categoria cadastrada ainda.'
                  : `Nenhuma categoria do tipo "${getTipoLabel(filtroTipo)}" encontrada.`
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
