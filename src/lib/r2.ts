import { supabase } from '@/integrations/supabase/client';
import imageCompression from 'browser-image-compression';

/**
 * Reduz e comprime imagens no navegador antes do upload
 */
async function otimizarImagem(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const options = {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp',
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    return new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
      type: 'image/webp',
    });
  } catch (error) {
    console.warn('Não foi possível comprimir a imagem, enviando original:', error);
    return file;
  }
}

/**
 * Função Universal para envio de mídia ao Cloudflare R2 via Edge Function
 */
export async function uploadParaR2(file: File, subpasta: string = 'imagens/geral'): Promise<string> {
  try {
    // 1. Otimiza a imagem antes do envio
    const arquivoPronto = await otimizarImagem(file);

    // 2. Obtém a URL do Supabase garantindo fallback caso a variável VITE não esteja no bundle
    const supabaseUrl = 
      import.meta.env.VITE_SUPABASE_URL || 
      (supabase as any).supabaseUrl || 
      'https://uyleozhwzngnvyddfvni.supabase.co';

    // 3. Monta o FormData
    const formData = new FormData();
    formData.append('file', arquivoPronto);
    formData.append('folder', subpasta);

    // 4. Pega a sessão/token de autenticação
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

    // 5. Dispara a requisição para o endpoint correto da Edge Function no Supabase
    const endpoint = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/upload-r2`;
    console.log('📤 Enviando arquivo para Edge Function:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('Resposta não-JSON da Edge Function:', responseText);
      throw new Error(`A Edge Function retornou status ${response.status}: ${responseText || 'Sem resposta de texto'}`);
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Erro ao realizar upload no Cloudflare R2');
    }

    return data.url;
  } catch (error: any) {
    console.error('Erro no uploadParaR2:', error);
    throw new Error(error.message || 'Falha ao enviar arquivo.');
  }
}
