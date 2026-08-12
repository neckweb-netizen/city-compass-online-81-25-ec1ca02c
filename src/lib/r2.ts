import { supabase } from './supabase'; // Importe seu cliente configurado do Supabase aqui

/**
 * Função Universal para enviar mídias (imagens/vídeos) ao Cloudflare R2
 * usando a Edge Function do Supabase de forma segura...
 * 
 * @param file Arquivo vindo do <input type="file">
 * @param subpasta Pasta de destino no bucket (ex: 'imagens/empresas', 'videos/stories', 'imagens/avatars')
 * @returns Retorna a URL pública completa do arquivo enviado no Cloudflare R2
 */
export async function uploadParaR2(file: File, subpasta: string = 'imagens/geral'): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', subpasta);

    // Pega a sessão/token do Supabase para garantir autorização naimport { supabase } from '@/integrations/supabase/client';

/**
 * Função Universal para enviar mídias (imagens/vídeos) ao Cloudflare R2
 * usando a Edge Function do Supabase de forma segura.
 * 
 * @param file Arquivo vindo do <input type="file">
 * @param subpasta Pasta de destino no bucket (ex: 'imagens/empresas', 'videos/stories', 'imagens/avatars')
 * @returns Retorna a URL pública completa do arquivo enviado no Cloudflare R2
 */
export async function uploadParaR2(file: File, subpasta: string = 'imagens/geral'): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', subpasta);

    // Pega a sessão/token do Supabase para garantir autorização na Edge Function
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const response = await fetch(`${supabaseUrl}/functions/v1/upload-r2`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao realizar upload no Cloudflare R2');
    }

    return data.url;
  } catch (error: any) {
    console.error('Erro no uploadParaR2:', error);
    throw new Error(error.message || 'Falha ao enviar arquivo.');
  }
} Edge Function
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    const response = await fetch(`${supabaseUrl}/functions/v1/upload-r2`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao realizar upload no Cloudflare R2');
    }

    return data.url; // URL final da mídia no Cloudflare R2
  } catch (error: any) {
    console.error('Erro no uploadParaR2:', error);
    throw new Error(error.message || 'Falha ao enviar arquivo.');
  }
}
