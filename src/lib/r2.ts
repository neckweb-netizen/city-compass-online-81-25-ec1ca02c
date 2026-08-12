import { supabase } from '@/integrations/supabase/client';

export async function uploadParaR2(file: File, subpasta: string = 'imagens/geral'): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', subpasta);

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

    // Pega a resposta em texto primeiro para evitar o crash de JSON.parse
    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('Resposta não-JSON recebida da Edge Function:', responseText);
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
