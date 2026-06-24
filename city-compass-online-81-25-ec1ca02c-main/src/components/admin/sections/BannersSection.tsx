
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, ExternalLink, Image, AlertCircle, Copy } from 'lucide-react';
import { useAdminBanners, Banner } from '@/hooks/useAdminBanners';
import { BannerForm } from '../forms/BannerForm';
import { DuplicateBannerModal } from '../forms/DuplicateBannerModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

const secaoOptions = [
  { value: 'all', label: 'Todas as Seções' },
  { value: 'home', label: 'Página Inicial' },
  { value: 'locais', label: 'Locais' },
  { value: 'eventos', label: 'Eventos' },
  { value: 'categorias', label: 'Categorias' },
  { value: 'busca', label: 'Busca' },
  { value: 'canal_video', label: 'Canal Informativo - Vídeos' },
];

export const BannersSection = () => {
  const [selectedSecao, setSelectedSecao] = useState('all');
  const { banners, isLoading, error, createBanner, updateBanner, deleteBanner, duplicateBanner } = useAdminBanners(selectedSecao);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | undefined>();
  const [duplicatingBanner, setDuplicatingBanner] = useState<Banner | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      console.log('Submitting banner data:', data);
      
      if (editingBanner) {
        await updateBanner.mutateAsync({ ...data, id: editingBanner.id });
      } else {
        await createBanner.mutateAsync(data);
      }
      setShowForm(false);
      setEditingBanner(undefined);
    } catch (error) {
      console.error('Erro ao salvar banner:', error);
      // O erro já é tratado no hook useAdminBanners
    }
  };

  const handleEdit = (banner: Banner) => {
    console.log('Editing banner:', banner);
    setEditingBanner(banner);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      console.log('Deleting banner:', id);
      await deleteBanner.mutateAsync(id);
    } catch (error) {
      console.error('Erro ao deletar banner:', error);
      // O erro já é tratado no hook useAdminBanners
    }
  };

  const handleDuplicate = (banner: Banner) => {
    console.log('Opening duplicate modal for banner:', banner);
    setDuplicatingBanner(banner);
    setShowDuplicateModal(true);
  };

  const handleDuplicateConfirm = async (bannerId: string, newSecao: Banner['secao']) => {
    try {
      console.log('Duplicating banner:', bannerId, 'to section:', newSecao);
      await duplicateBanner.mutateAsync({ id: bannerId, newSecao });
      setShowDuplicateModal(false);
      setDuplicatingBanner(null);
    } catch (error) {
      console.error('Erro ao duplicar banner:', error);
      // O erro já é tratado no hook useAdminBanners
    }
  };

  const handleCancel = () => {
    console.log('Form cancelled');
    setShowForm(false);
    setEditingBanner(undefined);
  };

  const getSecaoLabel = (secao: string) => {
    const option = secaoOptions.find(opt => opt.value === secao);
    return option ? option.label : secao;
  };

  if (showForm) {
    return (
      <BannerForm
        banner={editingBanner}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createBanner.isPending || updateBanner.isPending}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Banners Publicitários</h2>
          <p className="text-muted-foreground">
            Gerencie os banners publicitários exibidos nas diferentes seções do site
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Formatos aceitos: JPG, PNG, GIF • Tamanho recomendado: 1200x400px (responsivo automático)
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Banner
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar banners: {error instanceof Error ? error.message : 'Erro desconhecido'}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="secao-filter" className="text-sm font-medium">
            Filtrar por seção:
          </label>
          <Select value={selectedSecao} onValueChange={setSelectedSecao}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione a seção" />
            </SelectTrigger>
            <SelectContent>
              {secaoOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando banners...</div>
      ) : banners.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {selectedSecao !== 'all'
                ? `Nenhum banner encontrado para a seção "${getSecaoLabel(selectedSecao)}"` 
                : 'Nenhum banner publicitário cadastrado'
              }
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Clique em "Novo Banner" para adicionar o primeiro banner
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {banners.map((banner) => (
            <Card key={banner.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{banner.titulo}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={banner.ativo ? 'default' : 'secondary'}>
                        {banner.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Badge variant="outline">
                        {getSecaoLabel(banner.secao)}
                      </Badge>
                      <Badge variant="outline">Ordem {banner.ordem}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDuplicate(banner)}
                      disabled={updateBanner.isPending || deleteBanner.isPending || duplicateBanner.isPending}
                      title="Duplicar banner"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(banner)}
                      disabled={updateBanner.isPending || deleteBanner.isPending || duplicateBanner.isPending}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon"
                          disabled={updateBanner.isPending || deleteBanner.isPending || duplicateBanner.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o banner "{banner.titulo}"?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(banner.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="w-40 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0 border">
                    <img
                      src={banner.imagem_url}
                      alt={banner.titulo}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="text-sm text-muted-foreground">
                      <strong>Seção:</strong> {getSecaoLabel(banner.secao)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <strong>Arquivo:</strong> {banner.imagem_url.split('/').pop()}
                    </div>
                    {banner.link_url && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        <strong>Link:</strong> 
                        <a 
                          href={banner.link_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate"
                        >
                          {banner.link_url}
                        </a>
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Criado em: {new Date(banner.criado_em).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DuplicateBannerModal
        banner={duplicatingBanner}
        isOpen={showDuplicateModal}
        onClose={() => {
          setShowDuplicateModal(false);
          setDuplicatingBanner(null);
        }}
        onDuplicate={handleDuplicateConfirm}
        isLoading={duplicateBanner.isPending}
      />
    </div>
  );
};
