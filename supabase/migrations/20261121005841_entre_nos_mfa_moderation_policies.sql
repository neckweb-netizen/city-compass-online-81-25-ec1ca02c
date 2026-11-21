-- Require MFA for moderation, preserving public approved content and owners' access.
alter policy "Feed aprovado e proprio" on public.entre_nos_postagens
  using (status = 'aprovado' or usuario_id = (select auth.uid()) or (select private.admin_mfa_verified(null, false)));
alter policy "Comentarios aprovados e proprios" on public.entre_nos_comentarios
  using (status = 'aprovado' or usuario_id = (select auth.uid()) or (select private.admin_mfa_verified(null, false)));
alter policy "Admin modera postagem" on public.entre_nos_postagens
  using ((select private.admin_mfa_verified(null, false)))
  with check ((select private.admin_mfa_verified(null, false)));
alter policy "Admin modera comentario" on public.entre_nos_comentarios
  using ((select private.admin_mfa_verified(null, false)))
  with check ((select private.admin_mfa_verified(null, false)));
alter policy "Admin ve denuncias" on public.entre_nos_denuncias
  using ((select private.admin_mfa_verified(null, false)));
alter policy "Admin revisa denuncias" on public.entre_nos_denuncias
  using ((select private.admin_mfa_verified(null, false)))
  with check ((select private.admin_mfa_verified(null, false)));
alter policy "Autor remove postagem" on public.entre_nos_postagens
  using (usuario_id = (select auth.uid()) or (select private.admin_mfa_verified(null, false)));
alter policy "Autor remove comentario" on public.entre_nos_comentarios
  using (usuario_id = (select auth.uid()) or (select private.admin_mfa_verified(null, false)));
