-- Only the audited RPC may mutate CRM snapshots; reading remains owner-scoped via RLS.
-- Existing crm_cadernos rows and the legacy cobrancas_usuario table are not modified.
begin;
create or replace function public.save_crm_caderno(p_expected_revision bigint, p_dados jsonb)
returns bigint language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid;
  v_revision bigint;
begin
  v_user := (select auth.uid());
  if v_user is null then
    raise exception 'Autenticação necessária' using errcode = '28000';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 or p_dados is null or
     jsonb_typeof(p_dados) <> 'object' or p_dados->>'versao' <> '1' or
     jsonb_typeof(p_dados->'clientes') <> 'array' or
     jsonb_typeof(p_dados->'cobrancas') <> 'array' or
     jsonb_array_length(p_dados->'clientes') > 5000 or
     jsonb_array_length(p_dados->'cobrancas') > 20000 or
     pg_column_size(p_dados) > 2000000 then
    raise exception 'Dados do caderno inválidos' using errcode = '22023';
  end if;
  -- One atomic compare-and-swap. The request never provides an arbitrary user_id.
  if p_expected_revision = 0 then
    insert into public.crm_cadernos(user_id, dados, revision, updated_at)
    values (v_user, p_dados, 1, now())
    on conflict(user_id) do nothing
    returning revision into v_revision;
  else
    update public.crm_cadernos
       set dados = p_dados, revision = revision + 1, updated_at = now()
     where user_id = v_user and revision = p_expected_revision
     returning revision into v_revision;
  end if;
  return coalesce(v_revision, 0);
end; $$;
revoke all on function public.save_crm_caderno(bigint,jsonb) from public, anon;
grant execute on function public.save_crm_caderno(bigint,jsonb) to authenticated;
revoke insert, update, delete on public.crm_cadernos from authenticated, anon, public;
grant select on public.crm_cadernos to authenticated;
commit;