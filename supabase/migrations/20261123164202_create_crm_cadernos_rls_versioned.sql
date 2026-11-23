-- Applied to Supabase on 2026-11-23; preserved under the same migration version.
-- New owner-scoped CRM snapshot; legacy cobrancas_usuario is intentionally untouched.
create table if not exists public.crm_cadernos (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dados jsonb not null default '{"versao":1,"clientes":[],"cobrancas":[]}'::jsonb,
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint crm_payload_valid check (
    jsonb_typeof(dados) = 'object' and dados->>'versao' = '1'
    and jsonb_typeof(dados->'clientes') = 'array'
    and jsonb_typeof(dados->'cobrancas') = 'array'
    and jsonb_array_length(dados->'clientes') <= 5000
    and jsonb_array_length(dados->'cobrancas') <= 20000
    and pg_column_size(dados) <= 2000000
  )
);
alter table public.crm_cadernos enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='crm_cadernos' and policyname='crm_cadernos_select_owner') then
    create policy crm_cadernos_select_owner on public.crm_cadernos for select to authenticated
      using (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='crm_cadernos' and policyname='crm_cadernos_insert_owner') then
    create policy crm_cadernos_insert_owner on public.crm_cadernos for insert to authenticated
      with check (user_id = (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='crm_cadernos' and policyname='crm_cadernos_update_owner') then
    create policy crm_cadernos_update_owner on public.crm_cadernos for update to authenticated
      using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
  end if;
end $$;
revoke all on public.crm_cadernos from anon, public;
grant select, insert, update on public.crm_cadernos to authenticated;

create or replace function public.save_crm_caderno(p_expected_revision bigint, p_dados jsonb)
returns bigint language plpgsql security invoker set search_path = ''
as $$
declare v_revision bigint;
begin
  if (select auth.uid()) is null then raise exception 'Autenticação necessária'; end if;
  if p_expected_revision is null or p_expected_revision < 0 or p_dados is null or
     jsonb_typeof(p_dados) <> 'object' or p_dados->>'versao' <> '1' or
     jsonb_typeof(p_dados->'clientes') <> 'array' or
     jsonb_typeof(p_dados->'cobrancas') <> 'array' or
     jsonb_array_length(p_dados->'clientes') > 5000 or
     jsonb_array_length(p_dados->'cobrancas') > 20000 or
     pg_column_size(p_dados) > 2000000 then
    raise exception 'Dados do caderno inválidos';
  end if;
  insert into public.crm_cadernos(user_id, dados, revision, updated_at)
  select (select auth.uid()), p_dados, 1, now() where p_expected_revision = 0
  on conflict(user_id) do update
  set dados = excluded.dados, revision = public.crm_cadernos.revision + 1, updated_at = now()
  where public.crm_cadernos.revision = p_expected_revision
  returning revision into v_revision;
  if v_revision is null then
    update public.crm_cadernos
    set dados = p_dados, revision = revision + 1, updated_at = now()
    where user_id = (select auth.uid()) and revision = p_expected_revision
    returning revision into v_revision;
  end if;
  return coalesce(v_revision, 0);
end; $$;
revoke all on function public.save_crm_caderno(bigint, jsonb) from public, anon;
grant execute on function public.save_crm_caderno(bigint, jsonb) to authenticated;
