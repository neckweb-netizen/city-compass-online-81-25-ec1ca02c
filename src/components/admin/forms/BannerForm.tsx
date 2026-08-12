import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Banner } from '@/hooks/useAdminBanners';
import { uploadParaR2 } from '@/lib/r2';
import { Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const bannerSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(255, 'Título deve ter no máximo 255 caracteres'),
  imagem_url: z.string().optional(),
  codigo_html: z.string().optional(),
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
  secao: z.enum([
    'home', 
    'locais', 
    'eventos', 
    'categorias', 
    'busca', 
    'canal_video', 
    'domino', 
    'ferramentas', 
    'gerador_rifa',
    'gerador_cobranca',
    'criador_curriculo',
    'gestao_cobrancas',
    'calculadora_orcamento',
    'calculadora_margem',
    'simulador_rescisao',
    'leitor_voz'
  ], {
    errorMap: () => ({ message: 'Seção é obrigatória' })
  }),
  tipo_midia: z.enum(['imagem', 'video', 'codigo'], {
    errorMap: () => ({ message: 'Tipo de mídia é obrigatório' })
  }),
}).refine((data) => {
  if (data.tipo_midia === 'imagem' || data.tipo_midia === 'video') {
    return !!data.imagem_url && data.imagem_url.trim() !== '';
  }
  if (data.tipo_midia === 'codigo') {
    return !!data.codigo_html && data.codigo_html.trim() !== '';
  }
  return true;
}, {
  message: 'Preencha o conteúdo da mídia (imagem/URL/código)',
  path: ['imagem_url'],
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
  { value: 'domino', label: 'Jogo Dominó' },
  { value: 'ferramentas', label: 'Central de Ferramentas (Catálogo Geral)' },
  { value: 'gerador_rifa', label: 'Ferramenta - Gerador & Caderno de Rifas' },
  { value: 'gerador_cobranca', label: 'Ferramenta - Gerador de Cobrança PIX' },
  { value: 'criador_curriculo', label: 'Ferramenta - Criador de Currículo PDF' },
  { value: 'gestao_cobrancas', label: 'Ferramenta - Gestão de Cobranças (Micro CRM)' },
  { value: 'calculadora_orcamento', label: 'Ferramenta - Calculadora de Orçamento' },
  { value: 'calculadora_margem', label: 'Ferramenta - Calculadora de Maquininha & Margem' },
  { value: 'simulador_rescisao', label: 'Ferramenta - Simulador de Rescisão (CLT)' },
  { value: 'leitor_voz', label: 'Ferramenta - Leitor de Texto em Voz Alta' },
];

export const BannerForm = ({ banner, onSubmit, onCancel, isLoading }: BannerFormProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger } = useForm<BannerFormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      titulo: banner?.titulo || '',
      imagem_url: banner?.imagem_url || '',
      codigo_html: (banner as any)?.codigo_html || '',
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      // Envia para o Cloudflare R2 na pasta 'banners'
      const url = await uploadParaR2(file, 'banners');
      setValue('imagem_url', url);
      trigger('imagem_url');
      toast({ title: 'Mídia enviada com sucesso para o R2!' });
    } catch (error: any) {
      toast({
        title: 'Erro no envio da mídia',
        description: error.message || 'Falha ao enviar arquivo para o Cloudflare R2.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImageRemove = () => {
    setValue('imagem_url', '');
    trigger('imagem_url');
  };

  const handleSecaoChange = (value: string) => {
    setValue('secao', value as any);
    trigger(['secao', 'tipo_midia']);
  };

  const handleTipoMidiaChange = (value: string) => {
    setValue('tipo_midia', value as any);
    trigger(['tipo_midia', 'imagem_url', 'codigo_html']);
  };

  const handleFormSubmit = (data: BannerFormData) => {
    if (!data.titulo.trim()) {
      return;
    }

    const ordem = Math.max(1, Math.min(999, Math.floor(Number(data.ordem) || 1)));

    const formattedData = {
      ...data,
      titulo: data.titulo.trim(),
      link_url: data.link_url?.trim() || undefined,
      ordem: ordem,
    };

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
                <SelectItem value="codigo">Código / AdSense</SelectItem>
              </SelectContent>
            </Select>
            {errors.tipo_midia && (
              <p className="text-sm text-destructive mt-1">{errors.tipo_midia.message}</p>
            )}
          </div>

          {/* RENDERING DINÂMICO CONFORME O TIPO SELECIONADO */}
          {tipoMidia === 'imagem' && (
            <div>
              <Label>Imagem do Banner * (Cloudflare R2)</Label>
              <div className="mt-2">
                {imagemUrl ? (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <img src={imagemUrl} alt="Banner" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleImageRemove}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Clique para enviar a imagem do banner</p>
                          <p className="text-xs text-muted-foreground">JPG, PNG, GIF ou WebP via Cloudflare R2</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={handleFileUpload}
                    />
                  </label>
                )}
              </div>
              {errors.imagem_url && (
                <p className="text-sm text-destructive mt-1">{errors.imagem_url.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Formatos aceitos: JPG, PNG, GIF, WebP • Tamanho recomendado: 1200x400px
              </p>
            </div>
          )}

          {tipoMidia === 'video' && (
            <div>
              <Label>URL ou Upload de Vídeo *</Label>
              <div className="space-y-2 mt-2">
                <Input
                  value={imagemUrl || ''}
                  onChange={(e) => {
                    setValue('imagem_url', e.target.value);
                    trigger('imagem_url');
                  }}
                  placeholder="https://youtube.com/watch?v=... ou insira o link direto"
                  type="url"
                />
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">ou faça upload do vídeo direto no R2:</span>
                  <label className="cursor-pointer inline-flex items-center gap-1 text-xs bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-md font-medium">
                    {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    Upload Vídeo
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>
              {errors.imagem_url && (
                <p className="text-sm text-destructive mt-1">{errors.imagem_url.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Suporta URLs do YouTube/Vimeo ou envio direto de arquivos .mp4
              </p>
            </div>
          )}

          {tipoMidia === 'codigo' && (
            <div>
              <Label htmlFor="codigo_html">Código HTML / AdSense *</Label>
              <Textarea
                id="codigo_html"
                {...register('codigo_html')}
                placeholder={`<script async src="https://pagead2.googlesyndication.com/..."></script>\n<ins class="adsbygoogle" ...></ins>`}
                className="mt-2 font-mono text-xs min-h-[120px]"
              />
              {errors.codigo_html && (
                <p className="text-sm text-destructive mt-1">{errors.codigo_html.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Cole aqui o bloco de código gerado pelo Google AdSense ou qualquer HTML/Script de anúncio.
              </p>
            </div>
          )}

          {tipoMidia !== 'codigo' && (
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
          )}

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
            <Button type="submit" disabled={isLoading || uploading}>
              {isLoading ? 'Salvando...' : (banner ? 'Atualizar' : 'Criar')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading || uploading}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
