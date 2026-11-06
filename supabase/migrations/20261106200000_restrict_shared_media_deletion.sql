-- Restrict destructive operations on shared media to the general admin with MFA.
-- City admins may still upload new administrative media, but cannot overwrite
-- or delete objects owned by other users or another city.
-- Existing owner-scoped policies for user UUID prefixes remain intact.
DROP POLICY IF EXISTS "Admins com MFA atualizam mídias administrativas" ON storage.objects;
CREATE POLICY "Admin geral com MFA atualiza midias administrativas"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('banners','videos_canal','icones_categorias','imagens','imagens_empresas','imagens_eventos')
  AND private.admin_mfa_verified(NULL::uuid, true)
)
WITH CHECK (
  bucket_id IN ('banners','videos_canal','icones_categorias','imagens','imagens_empresas','imagens_eventos')
  AND private.admin_mfa_verified(NULL::uuid, true)
);

DROP POLICY IF EXISTS "Admins com MFA excluem mídias administrativas" ON storage.objects;
CREATE POLICY "Admin geral com MFA exclui midias administrativas"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('banners','videos_canal','icones_categorias','imagens','imagens_empresas','imagens_eventos')
  AND private.admin_mfa_verified(NULL::uuid, true)
);
