import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import imageCompression from 'browser-image-compression';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: import.meta.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME;
const PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL;

/**
 * Função Universal para Upload de Mídias no Cloudflare R2
 * @param file Arquivo vindo do input (File)
 * @param pasta Subpasta de destino dentro de 'imagens' ou 'videos' (ex: 'empresas', 'eventos', 'avatars')
 * @returns Retorna a URL pública completa do arquivo enviado
 */
export async function uploadParaR2(file: File, subpasta: string = 'geral'): Promise<string> {
  try {
    let arquivoParaUpload = file;
    const ehImagem = file.type.startsWith('image/');
    
    // Pasta raiz no bucket baseada no tipo de mídia
    const pastaRaiz = ehImagem ? 'imagens' : 'videos';

    // Compressão automática para WebP se for imagem
    if (ehImagem) {
      const opcoesCompressao = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp',
      };
      
      arquivoParaUpload = await imageCompression(file, opcoesCompressao);
    }

    const extensao = arquivoParaUpload.type.split('/')[1] || (ehImagem ? 'webp' : 'mp4');
    const nomeArquivo = `${pastaRaiz}/${subpasta}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extensao}`;

    const buffer = await arquivoParaUpload.arrayBuffer();

    const comando = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: nomeArquivo,
      Body: new Uint8Array(buffer),
      ContentType: arquivoParaUpload.type,
    });

    await r2Client.send(comando);

    return `${PUBLIC_URL}/${nomeArquivo}`;
  } catch (error) {
    console.error('Erro ao realizar upload no Cloudflare R2:', error);
    throw new Error('Falha no upload da mídia. Tente novamente.');
  }
}
