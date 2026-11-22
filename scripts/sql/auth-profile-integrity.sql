-- Auditoria SOMENTE LEITURA. Execute como operador autorizado no SQL Editor.
-- Não retorna e-mails, nomes, hashes de senha nem IDs individuais.
-- Divergência pode indicar perfis históricos removidos ou contas não migradas.
select
  (select count(*) from auth.users) as auth_accounts,
  (select count(*) from public.usuarios) as public_profiles,
  (select count(*) from auth.users a left join public.usuarios u on u.id = a.id where u.id is null) as auth_without_profile,
  (select count(*) from public.usuarios u left join auth.users a on a.id = u.id where a.id is null) as profiles_without_auth,
  (select count(*) from public.empresas e left join public.usuarios u on u.id = e.usuario_id
    where e.usuario_id is not null and u.id is null) as companies_without_owner;

-- Confira se o gatilho de novos cadastros continua presente.
select exists (
  select 1 from pg_trigger t
  where t.tgrelid = 'auth.users'::regclass and t.tgname = 'on_auth_user_created'
    and t.tgenabled in ('O', 'A') and not t.tgisinternal
) as signup_trigger_enabled;

-- Proteção contra exclusão em cascata de perfis.
select has_table_privilege('authenticated', 'public.usuarios', 'DELETE') as authenticated_can_delete_profile;
