import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { S3Client, PutObjectCommand } from 'https://esm.sh/@aws-sdk/client-s3@3.370.0';

serve(async (req) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'geral';

    if (!file) {
      return new Response(JSON.stringify({ error: 'Nenhum arquivo enviado' }), { status: 400 });
    }

    const r2Client = new S3Client({
      region: 'auto',
      endpoint: Deno.env.get('R2_ENDPOINT')!,
      credentials: {
        accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID')!,
        secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY')!,
      },
    });

    const fileExt = file.name.split('.').pop() || 'bin';
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();

    await r2Client.send(
      new PutObjectCommand({
        Bucket: Deno.env.get('R2_BUCKET_NAME')!,
        Key: fileName,
        Body: new Uint8Array(arrayBuffer),
        ContentType: file.type,
      })
    );

    const publicUrl = `${Deno.env.get('R2_PUBLIC_URL')}/${fileName}`;

    return new Response(JSON.stringify({ url: publicUrl }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
