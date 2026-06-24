import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMinhaEmpresa } from '@/hooks/useMinhaEmpresa';
import { ImageUpload } from '@/components/ui/image-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Instagram, Youtube, Twitter, Globe, Trash2 } from 'lucide-react';

interface InfluencerEditFormProps {
  empresa: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SocialMedia {
  platform: string;
  url: string;
}

export const InfluencerEditForm = ({ empresa, open, onOpenChange }: InfluencerEditFormProps) => {
  const { updateEmpresa, isUpdating } = useMinhaEmpresa();
  const { toast } = useToast();
  const [socialMedias, setSocialMedias] = useState<SocialMedia[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset
  } = useForm();

  const watchedImagemCapa = watch('imagem_capa_url');

  useEffect(() => {
    if (empresa && open) {
      // Resetar formulário com dados da empresa
      reset({
        nome: empresa.nome || '',
        descricao: empresa.descricao || '',
        endereco: empresa.endereco || '',
        telefone: empresa.telefone || '',
        imagem_capa_url: empresa.imagem_capa_url || '',
      });

      // Parsear redes sociais
      try {
        if (empresa.site && empresa.site.startsWith('{')) {
          const parsedSocial = JSON.parse(empresa.site);
          const socialArray = Object.entries(parsedSocial).map(([platform, url]) => ({
            platform,
            url: url as string
          }));
          setSocialMedias(socialArray);
        } else if (empresa.site) {
          setSocialMedias([{ platform: 'site', url: empresa.site }]);
        } else {
          setSocialMedias([]);
        }
      } catch {
        setSocialMedias(empresa.site ? [{ platform: 'site', url: empresa.site }] : []);
      }
    }
  }, [empresa, open, reset]);

  const addSocialMedia = () => {
    setSocialMedias([...socialMedias, { platform: '', url: '' }]);
  };

  const removeSocialMedia = (index: number) => {
    setSocialMedias(socialMedias.filter((_, i) => i !== index));
  };

  const updateSocialMedia = (index: number, field: 'platform' | 'url', value: string) => {
    const updated = [...socialMedias];
    updated[index][field] = value;
    setSocialMedias(updated);
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'youtube': return <Youtube className="w-4 h-4" />;
      case 'twitter': case 'x': return <Twitter className="w-4 h-4" />;
      case 'tiktok': return <Globe className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const onSubmit = async (data: any) => {
    try {
      // Converter redes sociais para JSON
      const socialMediaObject: Record<string, string> = {};
      socialMedias.forEach(({ platform, url }) => {
        if (platform && url) {
          socialMediaObject[platform] = url;
        }
      });

      const updateData = {
        nome: data.nome,
        descricao: data.descricao,
        endereco: data.endereco,
        telefone: data.telefone,
        imagem_capa_url: data.imagem_capa_url,
        site: Object.keys(socialMediaObject).length > 0 ? JSON.stringify(socialMediaObject) : null,
      };

      await updateEmpresa(updateData);
      onOpenChange(false);
      toast({
        title: 'Perfil atualizado!',
        description: 'As informações do criador foram atualizadas com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o perfil. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const platformOptions = [
    'Instagram',
    'YouTube', 
    'TikTok',
    'Twitter',
    'X',
    'Facebook',
    'LinkedIn',
    'Twitch',
    'Site Pessoal',
    'Blog',
    'Outros'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil de Criador</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="nome">Nome do Criador *</Label>
                  <Input
                    id="nome"
                    {...register('nome', { required: 'Nome é obrigatório' })}
                    placeholder="Seu nome artístico ou profissional"
                  />
                  {errors.nome && (
                    <p className="text-sm text-red-500 mt-1">{errors.nome.message as string}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="telefone">Telefone para Contato</Label>
                  <Input
                    id="telefone"
                    {...register('telefone')}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="endereco">Localização</Label>
                <Input
                  id="endereco"
                  {...register('endereco')}
                  placeholder="Cidade, Estado"
                />
              </div>

              <div>
                <Label htmlFor="descricao">Sobre Você</Label>
                <Textarea
                  id="descricao"
                  {...register('descricao')}
                  placeholder="Conte um pouco sobre seu trabalho, estilo de conteúdo e experiências..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Foto de Perfil */}
          <Card>
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                value={watchedImagemCapa}
                onChange={(url) => setValue('imagem_capa_url', url)}
                bucket="imagens_empresas"
                className="aspect-square max-w-xs mx-auto"
              />
            </CardContent>
          </Card>

          {/* Redes Sociais */}
          <Card>
            <CardHeader>
              <CardTitle>Redes Sociais & Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {socialMedias.map((social, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>Plataforma</Label>
                    <select
                      value={social.platform}
                      onChange={(e) => updateSocialMedia(index, 'platform', e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Selecione...</option>
                      {platformOptions.map(platform => (
                        <option key={platform} value={platform.toLowerCase()}>
                          {platform}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-2">
                    <Label>URL/Link</Label>
                    <Input
                      value={social.url}
                      onChange={(e) => updateSocialMedia(index, 'url', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {getSocialIcon(social.platform)}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSocialMedia(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addSocialMedia}
                className="w-full"
              >
                Adicionar Rede Social
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};