
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { Banner } from '@/hooks/useAdminBanners';

const bannerSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(255, 'Título deve ter no máximo 255 caracteres'),
  imagem_url: z.string().min(1, 'Mídia é obrigatória').url('URL da mídia inválida'),
  link_url: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, 'URL do link inválida'),
  ativo: z.boolean(),
  ordem: z.number().min(1, 'Ordem deve ser no mínimo 1').max(999, 'Ordem deve ser no máximo 999'),
  secao: z.enum(['home', 'locais', 'eventos', 'categorias', 'busca', 'canal_video'], {
    errorMap: () => ({ message: 'Seção é obrigatória' })
  }),
  tipo_midia: z.enum(['imagem', 'video'], {
    errorMap: () => ({ message: 'Tipo de mídia é obrigatório' })
  }),
});

type BannerFormData = z.infer<typeof bannerSchema>;

interface BannerFormProps {
  banner?: Banner;
  onSubmit: (data: BannerFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const secaoOptions = [
  { value: 'home', label: 'Página Inicial' },
  { value: 'locais', label: 'Locais' },
  { value: 'eventos', label: 'Eventos' },
  { value: 'categorias', label: 'Categorias' },
  { value: 'busca', label: 'Busca' },
  { value: 'canal_video', label: 'Canal Informativo - Vídeos' },
];

export const BannerForm = ({ banner, onSubmit, onCancel, isLoading }: BannerFormProps) => {
  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      titulo: banner?.titulo || '',
      imagem_url: banner?.imagem_url || '',
      link_url: banner?.link_url || '',
      ativo: banner?.ativo ?? true,
      ordem: banner?.ordem || 1,
      secao: banner?.secao === 'empresas' ? 'locais' : (banner?.secao as any) || 'home',
      tipo_midia: (banner as any)?.tipo_midia || 'imagem',
    },
  });

  const ativo = watch('ativo');
  const imagemUrl = watch('imagem_url');
  const secao = watch('secao');
  const tipoMidia = watch('tipo_midia');

  const handleImageChange = (url: string) => {
    console.log('Image URL changed:', url);
    setValue('imagem_url', url);
    trigger('imagem_url');
  };

  const handleImageRemove = () => {
    console.log('Image removed');
    setValue('imagem_url', '');
    trigger('imagem_url');
  };

  const handleSecaoChange = (value: string) => {
    console.log('Section changed:', value);
    setValue('secao', value as any);
    trigger(['secao', 'tipo_midia']);
  };

  const handleTipoMidiaChange = (value: string) => {
    console.log('Media type changed:', value);
    setValue('tipo_midia', value as any);
    setValue('imagem_url', ''); // Reset URL when changing type
    trigger(['tipo_midia', 'imagem_url']);
  };

  const handleFormSubmit = (data: BannerFormData) => {
    console.log('Form submitted with data:', data);
    
    // Validação adicional antes do envio
    if (!data.titulo.trim()) {
      console.error('Título é obrigatório');
      return;
    }
    
    if (!data.imagem_url) {
      console.error('Mídia é obrigatória');
      return;
    }

    // Ensure ordem is within valid range
    const ordem = Math.max(1, Math.min(999, Math.floor(Number(data.ordem) || 1)));

    // Limpar link_url se estiver vazio
    const formattedData = {
      ...data,
      titulo: data.titulo.trim(),
      link_url: data.link_url?.trim() || undefined,
      ordem: ordem,
    };

    console.log('Submitting formatted data:', formattedData);
    onSubmit(formattedData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{banner ? 'Editar Banner' : 'Novo Banner'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              {...register('titulo')}
              placeholder="Título do banner"
              maxLength={255}
            />
            {errors.titulo && (
              <p className="text-sm text-destructive mt-1">{errors.titulo.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="secao">Seção *</Label>
            <Select value={secao} onValueChange={handleSecaoChange}>
              <SelectTrigger>
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
            {errors.secao && (
              <p className="text-sm text-destructive mt-1">{errors.secao.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="tipo-midia">Tipo de Mídia *</Label>
            <Select value={tipoMidia} onValueChange={handleTipoMidiaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="imagem">Imagem</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
              </SelectContent>
            </Select>
            {errors.tipo_midia && (
              <p className="text-sm text-destructive mt-1">{errors.tipo_midia.message}</p>
            )}
          </div>

          <div>
            <Label>{tipoMidia === 'video' ? 'URL do Vídeo *' : 'Imagem do Banner *'}</Label>
            {tipoMidia === 'imagem' ? (
              <ImageUpload
                value={imagemUrl}
                onChange={handleImageChange}
                onRemove={handleImageRemove}
                bucket="banners"
                accept="image/*,image/gif"
                maxSize={10}
                className="mt-2"
              />
            ) : (
              <div className="space-y-2 mt-2">
                <Input
                  value={imagemUrl}
                  onChange={(e) => {
                    setValue('imagem_url', e.target.value);
                    trigger('imagem_url');
                  }}
                  placeholder="https://youtube.com/watch?v=... ou URL direta do vídeo"
                  type="url"
                />
                <p className="text-xs text-muted-foreground">
                  Suporta URLs do YouTube, Vimeo ou links diretos para arquivos de vídeo (.mp4, .webm, .ogg)
                </p>
              </div>
            )}
            {errors.imagem_url && (
              <p className="text-sm text-destructive mt-1">{errors.imagem_url.message}</p>
            )}
            {tipoMidia === 'imagem' && (
              <p className="text-xs text-muted-foreground mt-1">
                Formatos aceitos: JPG, PNG, GIF • Tamanho recomendado: 1200x400px para desktop, responsivo automático
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="link_url">URL do Link (opcional)</Label>
            <Input
              id="link_url"
              {...register('link_url')}
              placeholder="https://exemplo.com"
              type="url"
            />
            {errors.link_url && (
              <p className="text-sm text-destructive mt-1">{errors.link_url.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Deixe em branco se o banner não deve redirecionar para nenhum link
            </p>
          </div>

          <div>
            <Label htmlFor="ordem">Ordem (1-999) *</Label>
            <Input
              id="ordem"
              type="number"
              min="1"
              max="999"
              {...register('ordem', { valueAsNumber: true })}
            />
            {errors.ordem && (
              <p className="text-sm text-destructive mt-1">{errors.ordem.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Ordem de exibição do banner (1 = primeiro)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={ativo}
              onCheckedChange={(checked) => setValue('ativo', checked)}
            />
            <Label htmlFor="ativo">Banner ativo</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : (banner ? 'Atualizar' : 'Criar')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
