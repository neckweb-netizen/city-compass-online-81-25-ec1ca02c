
import { useParams } from 'react-router-dom';
import { LocalsList } from '@/components/locais/LocalsList';
import { useCategorias } from '@/hooks/useCategorias';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const CategoriaLocais = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: categorias } = useCategorias();
  const navigate = useNavigate();

  const categoria = categorias?.find(cat => cat.slug === slug);

  const handleBack = () => {
    navigate('/');
  };

  const renderIcon = (categoria: any) => {
    if (!categoria.icone_url) {
      return <span className="text-2xl">🏢</span>;
    }

    // Se for um emoji (caracteres Unicode) - regex expandida para cobrir mais emojis
    if (categoria.icone_url.match(/[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{FE00}-\u{FE0F}]|[\u{E0020}-\u{E007F}]|[\u{200D}]|[\u{20E3}]|[\u{2700}-\u{27BF}]|[\u{24C2}]|[\u{1F170}-\u{1F251}]/u)) {
      return <span className="text-2xl">{categoria.icone_url}</span>;
    }

    // Se for uma URL
    return (
      <img 
        src={categoria.icone_url} 
        alt={categoria.nome}
        className="w-8 h-8 object-contain"
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
          if (fallback) {
            fallback.style.display = 'inline';
          }
        }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-20">
        {/* Header da categoria */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground px-4 py-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center relative">
                {categoria ? renderIcon(categoria) : <span className="text-2xl">🏢</span>}
                <span className="fallback-icon text-2xl hidden">🏢</span>
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-foreground">{categoria?.nome || 'Categoria'}</h1>
                <p className="text-primary-foreground/80 text-sm">Locais disponíveis</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de locais */}
        <div className="px-4 py-6">
          {categoria && <LocalsList categoriaId={categoria.id} />}
        </div>
      </main>
    </div>
  );
};

export default CategoriaLocais;
