-- Bloqueia a remoção direta de perfis: FKs ON DELETE CASCADE apagam empresas,
-- avaliações e outros dados, mas não removem a conta do Supabase Auth.
-- Uma exclusão completa futura deve ser uma operação administrativa
-- dedicada, auditável e com verificação de dependências.
drop policy if exists "Somente admin geral com MFA pode excluir usuários" on public.usuarios;
revoke delete on public.usuarios from authenticated;
