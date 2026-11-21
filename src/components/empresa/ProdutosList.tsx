
import { useState } from 'react';
import { useProdutosPorEmpresa, useExcluirProduto } from '@/hooks/useProdutos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NeonCard } from '@/components/ui/neon-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogCancel, 
  AlertDialogAction 
} from '@/components/ui/alert-dialog';
import { ProdutoForm } from './ProdutoForm';
import { Plus, Edit, Trash2, Star, ShoppingCart, MessageCircle } from 'lucide-react';
import { useMinhaEmpresa } from '@/hooks/useMinhaEmpresa';
import { usePlanoLimites } from '@/hooks/usePlanoLimites';
import { getSafeNavigationUrl } from '@/lib/safeNavigation';

interface ProdutosListProps {
  empresaId: string;
}

export const ProdutosList = ({ empresaId }: ProdutosListProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingProduto, setEditingProduto] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [checkingLimit, setCheckingLimit] = useState(false);

  const { data: produtos, isLoading, isError, refetch } = useProdutosPorEmpresa(empresaId);
  const excluirProduto = useExcluirProduto();
  const { podeEditar } = useMinhaEmpresa();
  const { verificarLimiteProdutos } = usePlanoLimites(empresaId);
  
  // Verificar se o usuário pode editar esta empresa
  const podeEditarEstaEmpresa = podeEditar(empresaId);
  const visibleProducts = (produtos ?? []).filter(produto => podeEditarEstaEmpresa || produto.ativo);

  const handleEdit = (produto: any) => {
    setEditingProduto(produto);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId || excluirProduto.isPending) return;
    try {
      await excluirProduto.mutateAsync({ id: deleteId, empresaId });
      setDeleteId(null);
    } catch {
      // A operação já exibe uma mensagem de erro; preservar confirmação para nova tentativa.
    }
  };

  const handleNewProduct = async () => {
    if (checkingLimit || excluirProduto.isPending) return;
    setCheckingLimit(true);
    try {
      if (await verificarLimiteProdutos()) {
        setEditingProduto(null);
        setShowForm(true);
      }
    } catch {
      // Não libera a criação quando a consulta dos limites falha.
      // A operação deve ser tentada novamente após a conexão voltar.
    } finally {
      setCheckingLimit(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduto(null);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <Skeleton className="w-full lg:w-16 h-32 lg:h-16 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="space-y-3 rounded-xl border p-6 text-center">
        <h2 className="font-semibold">Não foi possível carregar os produtos</h2>
        <p className="text-sm text-muted-foreground">Verifique sua conexão e tente novamente.</p>
        <Button type="button" variant="outline" onClick={() => { void refetch(); }}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold">Produtos</h2>
        {podeEditarEstaEmpresa && (
          <Button 
            onClick={() => { void handleNewProduct(); }}
            disabled={checkingLimit || excluirProduto.isPending}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        )}
      </div>

      {visibleProducts.length > 0 ? (
        <div className="grid gap-4">
          {visibleProducts.map((produto) => (
            <Card key={produto.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="w-full lg:w-16 h-40 lg:h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {produto.imagem_principal_url ? (
                      <img 
                        src={produto.imagem_principal_url} 
                        alt={produto.nome}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h3 className="font-semibold text-base lg:text-lg truncate">{produto.nome}</h3>
                      {!produto.ativo && podeEditarEstaEmpresa && <Badge variant="outline">Desativado</Badge>}
                      {produto.destaque && (
                        <Badge variant="secondary" className="text-xs w-fit">
                          <Star className="w-3 h-3 mr-1" />
                          Destaque
                        </Badge>
                      )}
                    </div>
                    
                    {produto.descricao && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {produto.descricao}
                      </p>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        {produto.preco_promocional ? (
                          <>
                            <span className="line-through text-gray-500 text-sm">
                              {formatPrice(produto.preco_original)}
                            </span>
                            <span className="font-bold text-green-600">
                              {formatPrice(produto.preco_promocional)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold">
                            {formatPrice(produto.preco_original)}
                          </span>
                        )}
                      </div>
                      
                      {produto.estoque_disponivel != null && (
                        <span className="text-gray-500 text-sm">
                          Estoque: {produto.estoque_disponivel}
                        </span>
                      )}
                    </div>
                    
                    {/* Botões de ação do produto */}
                    {(getSafeNavigationUrl(produto.link_compra) || getSafeNavigationUrl(produto.link_whatsapp)) && (
                      <div className="flex gap-2 mb-3">
                        {getSafeNavigationUrl(produto.link_compra) && (
                          <Button
                            variant="default"
                            size="sm"
                            asChild
                            className="flex-1 sm:flex-none"
                          >
                            <a 
                              href={getSafeNavigationUrl(produto.link_compra) ?? undefined}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              Comprar
                            </a>
                          </Button>
                        )}
                        {getSafeNavigationUrl(produto.link_whatsapp) && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="flex-1 sm:flex-none text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <a 
                              href={getSafeNavigationUrl(produto.link_whatsapp) ?? undefined}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              <MessageCircle className="w-4 h-4" />
                              WhatsApp
                            </a>
                          </Button>
                        )}
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-1">
                        {produto.categoria_produto && (
                          <Badge variant="outline" className="text-xs">
                            {produto.categoria_produto}
                          </Badge>
                        )}
                        {produto.codigo_produto && (
                          <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                            #{produto.codigo_produto}
                          </span>
                        )}
                      </div>
                      
                      {podeEditarEstaEmpresa && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(produto)}
                            disabled={excluirProduto.isPending}
                            aria-label={`Editar produto ${produto.nome}`}
                            className="flex-1 sm:flex-none"
                          >
                            <Edit className="w-4 h-4 sm:mr-0 lg:mr-2" />
                            <span className="sm:hidden lg:inline">Editar</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteId(produto.id)}
                            disabled={excluirProduto.isPending}
                            aria-label={`Desativar produto ${produto.nome}`}
                            className="flex-1 sm:flex-none"
                          >
                            <Trash2 className="w-4 h-4 sm:mr-0 lg:mr-2" />
                            <span className="sm:hidden lg:inline">Excluir</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">Nenhum produto cadastrado ainda</p>
            {podeEditarEstaEmpresa && (
              <Button 
                onClick={() => { void handleNewProduct(); }}
                disabled={checkingLimit || excluirProduto.isPending}
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeiro Produto
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {showForm && (
        <ProdutoForm
          empresaId={empresaId}
          produto={editingProduto}
          onClose={handleCloseForm}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(nextOpen) => { if (!nextOpen && !excluirProduto.isPending) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar este produto? Ele deixará de aparecer publicamente, mas continuará cadastrado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluirProduto.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={excluirProduto.isPending} onClick={() => { void handleDelete(); }}>
              {excluirProduto.isPending ? 'Desativando...' : 'Desativar produto'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
