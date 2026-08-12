import { supabase } from '@/integrations/supabase/client';
import imageCompression from 'browser-image-compression';

/**
 * Reduz e comprime imagens no navegador antes do upload
 */
async function otimizarImagem(file: File): Promise<File> {
  // Se não for imagem (ex: vídeo), retorna o arquivo original
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const options = {
    maxSizeMB: 2, // Limite máximo de 2MB após compressão
    maxWidthOrHeight: 1920, // Redimensiona para resolução Full HD
    useWebWorker: true,
    fileType: 'image/webp', // Converte para o formato leve WebP
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    // Retorna o arquivo modificado preservando o nome original
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
    // 1. Otimiza a imagem antes de fazer a requisição
    const arquivoPronto = await otimizarImagem(file);

    // 2. Monta o FormData com o arquivo otimizado
    const formData = new FormData();
    formData.append('file', arquivoPronto);
    formData.append('folder', subpasta);

    // 3. Pega o token de autenticação
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    // 4. Dispara a requisição HTTP para a Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/upload-r2`, {
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
