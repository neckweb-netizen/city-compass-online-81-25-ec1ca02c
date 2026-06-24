
-- Criar bucket para banners publicitários
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true);

-- Criar política para permitir que admins façam upload de banners
CREATE POLICY "Admins podem fazer upload de banners"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'banners' AND
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND tipo_conta IN ('admin_geral', 'admin_cidade')
  )
);

-- Criar política para permitir que todos vejam banners públicos
CREATE POLICY "Todos podem ver banners públicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

-- Criar política para permitir que admins deletem banners
CREATE POLICY "Admins podem deletar banners"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'banners' AND
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND tipo_conta IN ('admin_geral', 'admin_cidade')
  )
);
