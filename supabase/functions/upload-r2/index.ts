import { S3Client, PutObjectCommand } from 'https://esm.sh/@aws-sdk/client-s3@3.1109.0';
import { corsHeaders, errorResponse, HttpError, jsonResponse, requireUser } from '../_shared/security.ts';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(req) });

  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Método não permitido');
    await requireUser(req);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const requestedFolder = (formData.get('folder') as string) || 'geral';

    if (!file) throw new HttpError(400, 'Nenhum arquivo enviado');
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) throw new HttpError(400, 'O arquivo deve ter no máximo 5 MB');
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new HttpError(400, 'Tipo de arquivo não permitido');
    if (requestedFolder.includes('..') || !/^[a-zA-Z0-9/_-]+$/.test(requestedFolder)) {
      throw new HttpError(400, 'Pasta de destino inválida');
    }
    const folder = requestedFolder.replace(/^\/+|\/+$/g, '') || 'geral';

    const endpoint = Deno.env.get('R2_ENDPOINT');
    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const bucket = Deno.env.get('R2_BUCKET_NAME');
    const publicBaseUrl = Deno.env.get('R2_PUBLIC_URL')?.replace(/\/$/, '');
    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
      throw new HttpError(503, 'Armazenamento não configurado');
    }

    const r2Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const extensionByType: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
      'image/gif': 'gif', 'image/avif': 'avif',
    };
    const fileName = `${folder}/${crypto.randomUUID()}.${extensionByType[file.type]}`;
    const arrayBuffer = await file.arrayBuffer();

    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: fileName,
        Body: new Uint8Array(arrayBuffer),
        ContentType: file.type,
      })
    );

    const publicUrl = `${publicBaseUrl}/${fileName}`;

    return jsonResponse(req, { url: publicUrl }, 201);
  } catch (error) {
    return errorResponse(req, error);
  }
});
