import { S3Client, PutObjectCommand } from 'https://esm.sh/@aws-sdk/client-s3@3.1109.0';
import { corsHeaders, errorResponse, HttpError, jsonResponse, requireUser } from '../_shared/security.ts';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const ADMIN_FOLDERS = new Set(['banners', 'eventos', 'notifications/images', 'notifications/icons']);
const MAX_REQUEST_SIZE = MAX_FILE_SIZE + 128 * 1024; // Multipart form overhead.

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (((bytes[offset] << 24) >>> 0) + (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) + bytes[offset + 3]) >>> 0;
}

function readUint32LE(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset]) + (bytes[offset + 1] << 8) +
    (bytes[offset + 2] << 16) + ((bytes[offset + 3] << 24) >>> 0)) >>> 0;
}

function matchesImageSignature(bytes: Uint8Array, type: string): boolean {
  if (bytes.length < 20) return false;
  const begins = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  const ascii = (offset: number, value: string) =>
    [...value].every((character, index) => bytes[offset + index] === character.charCodeAt(0));

  switch (type) {
    case 'image/jpeg':
      // Start/end markers prevent trivial prefix-only file spoofing.
      return begins(0xff, 0xd8, 0xff) && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
    case 'image/png':
      // PNG header, IHDR chunk and terminal IEND chunk.
      return begins(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a) &&
        readUint32BE(bytes, 8) === 13 && ascii(12, 'IHDR') &&
        readUint32BE(bytes, bytes.length - 12) === 0 &&
        ascii(bytes.length - 8, 'IEND') &&
        readUint32BE(bytes, bytes.length - 4) === 0xae426082;
    case 'image/gif':
      return (ascii(0, 'GIF87a') || ascii(0, 'GIF89a')) &&
        bytes.at(-1) === 0x3b;
    case 'image/webp':
      return ascii(0, 'RIFF') && ascii(8, 'WEBP') &&
        readUint32LE(bytes, 4) + 8 === bytes.length &&
        (ascii(12, 'VP8 ') || ascii(12, 'VP8L') || ascii(12, 'VP8X'));
    case 'image/avif':
      // ISO-BMFF ftyp may use additional compatible brands after the major brand.
      return ascii(4, 'ftyp') &&
        readUint32BE(bytes, 0) >= 16 &&
        readUint32BE(bytes, 0) <= bytes.length &&
        (ascii(8, 'avif') || ascii(8, 'avis') || ascii(16, 'avif') || ascii(16, 'avis'));
    default:
      return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(req) });

  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Método não permitido');
    await requireUser(req, ['admin_geral', 'admin_cidade']);

    // Reject oversized requests before parsing multipart data into memory.
    const declaredLength = req.headers.get('content-length');
    if (declaredLength !== null &&
        (!/^\\d+$/.test(declaredLength) || Number(declaredLength) > MAX_REQUEST_SIZE)) {
      throw new HttpError(413, 'Requisição de upload muito grande');
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const requestedFolder = formData.get('folder');

    if (!(file instanceof File)) throw new HttpError(400, 'Nenhum arquivo válido enviado');
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) throw new HttpError(400, 'O arquivo deve ter no máximo 5 MB');
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new HttpError(400, 'Tipo de arquivo não permitido');
    if (typeof requestedFolder !== 'string' || !ADMIN_FOLDERS.has(requestedFolder)) {
      throw new HttpError(400, 'Pasta de destino inválida');
    }
    const folder = requestedFolder;

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
    if (!matchesImageSignature(new Uint8Array(arrayBuffer), file.type)) {
      throw new HttpError(400, 'Conteúdo da imagem inválido');
    }

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
