
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon, Link } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  bucket: string;
  folder?: string;
  className?: string;
  accept?: string;
  maxSize?: number; // em MB
}

export const ImageUpload = ({
  value,
  onChange,
  onRemove,
  bucket,
  folder = '',
  className = '',
  accept = 'image/*',
  maxSize = 5
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);

      // Validar tamanho do arquivo
      if (file.size > maxSize * 1024 * 1024) {
        throw new Error(`Arquivo muito grande. Máximo ${maxSize}MB`);
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(data.publicUrl);
      
      toast({
        title: 'Imagem enviada com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro ao enviar imagem',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleUrlSubmit = () => {
    console.log('🔍 ImageUpload: Tentando adicionar URL:', urlInput.trim());
    
    if (!urlInput.trim()) {
      console.warn('⚠️ ImageUpload: URL vazia detectada');
      return;
    }

    try {
      // Validar se é uma URL válida
      const url = new URL(urlInput.trim());
      console.log('✅ ImageUpload: URL válida detectada:', url.href);
      
      // Verificar se é uma URL do Google (que pode ter problemas de CORS)
      const isGoogleUrl = url.hostname.includes('googleusercontent.com') || 
                         url.hostname.includes('google.com');
      
      if (isGoogleUrl) {
        console.warn('⚠️ ImageUpload: URL do Google detectada, limpando parâmetros');
        // Para URLs do Google, limpar parâmetros que podem causar problemas
        let cleanUrl = url.href;
        if (url.hostname.includes('googleusercontent.com')) {
          // Remover parâmetros de tamanho específicos do Google Photos/Maps
          cleanUrl = url.href.split('=')[0];
          console.log('🔄 URL do Google limpa:', cleanUrl);
        }
        
        onChange(cleanUrl);
        setUrlInput('');
        setShowUrlInput(false);
        toast({
          title: 'URL da imagem adicionada!',
          description: 'URL do Google foi otimizada para melhor compatibilidade.',
        });
        return;
      }
      
      // Testar se a URL da imagem é acessível para outros domínios
      const testImg = new Image();
      testImg.crossOrigin = 'anonymous';
      testImg.onload = () => {
        console.log('✅ ImageUpload: Imagem testada e carregou com sucesso');
        onChange(url.href);
        setUrlInput('');
        setShowUrlInput(false);
        toast({
          title: 'URL da imagem adicionada!',
        });
      };
      testImg.onerror = () => {
        console.error('❌ ImageUpload: Imagem não pôde ser carregada da URL');
        // Mesmo com erro no teste, permitir a URL (pode ser problema de CORS no teste)
        onChange(url.href);
        setUrlInput('');
        setShowUrlInput(false);
        toast({
          title: 'URL adicionada com aviso',
          description: 'A imagem foi adicionada, mas pode não carregar devido a restrições de CORS.',
          variant: 'default',
        });
      };
      testImg.src = url.href;
      
    } catch (error) {
      console.error('❌ ImageUpload: URL inválida:', error);
      toast({
        title: 'URL inválida',
        description: 'Por favor, insira uma URL válida.',
        variant: 'destructive',
      });
    }
  };

  const handleRemove = () => {
    onChange('');
    setUrlInput('');
    if (onRemove) {
      onRemove();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
      />
      
      {value ? (
        <div className="relative">
          <img
            src={value}
            alt="Preview"
            className="w-full h-40 object-cover rounded-lg border"
            onLoad={() => {
              console.log('✅ Imagem carregada com sucesso:', value);
            }}
            onError={(e) => {
              console.error('❌ Erro ao carregar imagem:', value);
              console.error('Detalhes do erro:', e);
            }}
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {showUrlInput ? (
            <div className="space-y-2">
              <Input
                placeholder="Cole a URL da imagem aqui..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                >
                  Adicionar URL
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowUrlInput(false);
                    setUrlInput('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full h-32 border-dashed"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <div className="flex flex-col items-center space-y-2">
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Clique para enviar imagem
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Máximo {maxSize}MB
                      </span>
                    </>
                  )}
                </div>
              </Button>
              
              <div className="text-center">
                <span className="text-xs text-muted-foreground">ou</span>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowUrlInput(true)}
              >
                <Link className="w-4 h-4 mr-2" />
                Inserir URL da imagem
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
