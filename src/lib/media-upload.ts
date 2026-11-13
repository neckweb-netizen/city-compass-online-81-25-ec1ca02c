import { supabase } from '@/integrations/supabase/client';
import { prepareImageForUpload, type ImageUploadProfile } from '@/lib/image-upload-optimization';

function getImageProfile(folder: string): ImageUploadProfile {
  if (/\/icons?(\/|$)/.test(folder)) return 'icon';
  if (folder === 'banners' || folder.includes('/banners')) return 'banner';
  if (folder === 'eventos' || /capas?|cover/i.test(folder)) return 'cover';
  return 'general';
}

export async function uploadMedia(file: File, subpasta: string = 'imagens/geral'): Promise<string> {
  console.log('[UPLOAD] Iniciando envio...');
  try {
    const arquivoPronto = await prepareImageForUpload(file, getImageProfile(subpasta), 5);
    console.log('[UPLOAD] Arquivo preparado:', {
      nome: arquivoPronto.name,
      tamanhoKB: (arquivoPronto.size / 1024).toFixed(2),
      tipo: arquivoPronto.type,
    });

    const supabaseUrl = 
      import.meta.env.VITE_SUPABASE_URL || 
      (supabase as any).supabaseUrl || 
      'https://uyleozhwzngnvyddfvni.supabase.co';

    const formData = new FormData();
    formData.append('file', arquivoPronto);
    formData.append('folder', subpasta);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

    const endpoint = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/upload-r2`;
    console.log('[UPLOAD] Enviando arquivo...');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    console.log('[UPLOAD] Resposta recebida:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    const responseText = await response.text();
    console.log('[UPLOAD] Resposta processada.');

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`Servidor respondeu com status ${response.status} em formato não-JSON: ${responseText || '(vazio)'}`);
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || `Erro no servidor (Status ${response.status})`);
    }

    console.log('[UPLOAD] Arquivo enviado com sucesso.');
    return data.url;
  } catch (error: any) {
    console.error('[UPLOAD] Falha no envio:', error);
    throw new Error(error.message || 'Falha de comunicação ao enviar o arquivo.');
  }
}
