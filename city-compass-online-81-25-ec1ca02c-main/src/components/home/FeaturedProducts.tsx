import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { NeonCard } from '@/components/ui/neon-card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, ShoppingBag, Verified, MessageCircle } from 'lucide-react';
import { useProdutos, Produto } from '@/hooks/useProdutos';
import { Button } from '@/components/ui/button';

export const FeaturedProducts = () => {
  const { data: produtos, isLoading } = useProdutos();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Agrupar produtos por empresa e randomizar a seleção
  const produtosFiltrados = useMemo(() => {
    if (!produtos || produtos.length === 0) return [];
    
    const produtosPorEmpresa: { [key: string]: any } = {};
    produtos.forEach((produto) => {
      if (!produtosPorEmpresa[produto.empresa_id]) {
        produtosPorEmpresa[produto.empresa_id] = [];
      }
      produtosPorEmpresa[produto.empresa_id].push(produto);
    });

    // Selecionar um produto aleatório de cada empresa
    const produtosAleatorios = Object.values(produtosPorEmpresa).map((produtosEmpresa: any[]) => {
      const randomIndex = Math.floor(Math.random() * produtosEmpresa.length);
      return produtosEmpresa[randomIndex];
    });

    // Embaralhar a ordem das empresas
    return produtosAleatorios.sort(() => Math.random() - 0.5);
  }, [produtos]);

  // Mostrar apenas os primeiros 3 produtos (sem paginação)
  const currentProducts = produtosFiltrados.slice(0, 3);

  if (isLoading) {
    return (
      <NeonCard className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Produtos em Destaque</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <NeonCard key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-t-lg" />
              <CardContent className="p-3">
                <div className="h-3 bg-muted rounded mb-2 w-1/2" />
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </CardContent>
            </NeonCard>
          ))}
        </div>
      </NeonCard>
    );
  }

  if (!produtos || produtos.length === 0) {
    return null;
  }


  return (
    <NeonCard className="p-4">
      <div className="flex items-center space-x-2 mb-4">
        <ShoppingBag className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Produtos em Destaque</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {currentProducts.map((produto) => (
          <NeonCard key={produto.id} className="hover-scale overflow-hidden group border-0 shadow-sm">
            <div className="aspect-[4/3] relative overflow-hidden">
              {produto.imagem_principal_url ? (
                <img
                  src={produto.imagem_principal_url}
                  alt={produto.nome}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              {produto.destaque && (
                <Badge className="absolute top-2 left-2 bg-primary text-xs px-2 py-0.5">
                  Destaque
                </Badge>
              )}
              {produto.preco_promocional && (
                <Badge variant="destructive" className="absolute top-2 right-2 text-xs px-2 py-0.5">
                  Promoção
                </Badge>
              )}
            </div>
            
            <CardContent className="p-3 space-y-2">
              {produto.empresas && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-primary">
                    {produto.empresas.nome}
                  </span>
                  {produto.empresas.verificado && (
                    <Verified className="h-3 w-3 text-primary" />
                  )}
                </div>
              )}
              
              <h3 className="font-semibold text-sm mb-1 line-clamp-1">
                {produto.nome}
              </h3>
              
              {produto.descricao && (
                <p className="text-muted-foreground text-xs mb-2 line-clamp-1">
                  {produto.descricao}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  {produto.preco_promocional ? (
                    <>
                      <span className="text-sm font-bold text-primary">
                        R$ {produto.preco_promocional.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground line-through">
                        R$ {produto.preco_original.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-primary">
                      R$ {produto.preco_original.toFixed(2)}
                    </span>
                  )}
                </div>
                
                {produto.categoria_produto && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {produto.categoria_produto}
                  </Badge>
                )}
              </div>

              {produto.estoque_disponivel !== null && produto.estoque_disponivel !== undefined && (
                <div className="mt-1 text-xs text-muted-foreground">
                  <span>
                    Estoque: {produto.estoque_disponivel > 0 ? produto.estoque_disponivel : 'Esgotado'}
                  </span>
                </div>
              )}

              {/* Botões de ação do produto */}
              {(produto.link_compra || produto.link_whatsapp) && (
                <div className="flex gap-1.5 mt-2">
                  {produto.link_compra && (
                    <Button
                      variant="default"
                      size="sm"
                      asChild
                      className="flex-1 text-xs px-2 py-1 h-7"
                    >
                      <a 
                        href={produto.link_compra} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        Comprar
                      </a>
                    </Button>
                  )}
                  {produto.link_whatsapp && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex-1 text-xs px-2 py-1 h-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <a 
                        href={produto.link_whatsapp} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </NeonCard>
        ))}
      </div>

      {currentProducts.length === 0 && (
        <div className="text-center py-6">
          <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Nenhum produto disponível no momento</p>
        </div>
      )}
    </NeonCard>
  );
};