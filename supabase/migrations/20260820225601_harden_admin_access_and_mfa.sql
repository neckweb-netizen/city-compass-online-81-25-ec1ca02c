-- Admin authorization must fail closed and require a verified second factor.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;
revoke execute on all functions in schema private from anon, authenticated;

create or replace function private.admin_mfa_verified(
  p_target_city_id uuid default null,
  p_require_general boolean default false
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt()->>'aal'), '') = 'aal2'
    and exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
        and (
          u.tipo_conta::text = 'admin_geral'
          or (
            not p_require_general
            and u.tipo_conta::text = 'admin_cidade'
            and (p_target_city_id is null or u.cidade_id = p_target_city_id)
          )
        )
    );
$$;

create or replace function private.admin_mfa_policy_passes()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
        and u.tipo_conta::text in ('admin_geral', 'admin_cidade')
    )
    or coalesce((select auth.jwt()->>'aal'), '') = 'aal2';
$$;

revoke all on function private.admin_mfa_verified(uuid, boolean) from public;
revoke all on function private.admin_mfa_policy_passes() from public;
grant execute on function private.admin_mfa_verified(uuid, boolean) to authenticated, service_role;
grant execute on function private.admin_mfa_policy_passes() to authenticated, service_role;

-- Replace the legacy helper that returned true whenever target_user_id was null.
create or replace function public.user_has_permission(
  target_user_id uuid default null,
  target_cidade_id uuid default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return false;
  end if;

  if private.admin_mfa_verified(target_cidade_id, false) then
    return true;
  end if;

  return target_user_id is not null and target_user_id = (select auth.uid());
end;
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select _user_id = (select auth.uid())
    and private.admin_mfa_verified(null, false);
$$;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select _user_id = (select auth.uid())
    and exists (
      select 1
      from public.user_roles ur
      where ur.user_id = _user_id
        and ur.role = _role
    )
    and (
      _role::text not in ('admin_geral', 'admin_cidade')
      or coalesce((select auth.jwt()->>'aal'), '') = 'aal2'
    );
$$;

create or replace function public.get_current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.tipo_conta::text
  from public.usuarios u
  where u.id = (select auth.uid());
$$;

create or replace function public.get_user_primary_role(_user_id uuid)
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select ur.role
  from public.user_roles ur
  where ur.user_id = _user_id
    and (
      _user_id = (select auth.uid())
      or private.admin_mfa_verified(null, false)
    )
  order by case ur.role
    when 'admin_geral' then 1
    when 'admin_cidade' then 2
    when 'empresa' then 3
    when 'criador_empresa' then 4
    when 'usuario' then 5
  end
  limit 1;
$$;

revoke all on function public.user_has_permission(uuid, uuid) from public, anon;
revoke all on function public.is_admin(uuid) from public, anon;
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.get_current_user_role() from public, anon;
revoke all on function public.get_user_primary_role(uuid) from public, anon;
grant execute on function public.user_has_permission(uuid, uuid) to authenticated, service_role;
grant execute on function public.is_admin(uuid) to authenticated, service_role;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;
grant execute on function public.get_current_user_role() to authenticated, service_role;
grant execute on function public.get_user_primary_role(uuid) to authenticated, service_role;

-- Policies that call privileged helpers must never run as anon.
alter policy "Admins podem gerenciar bairros" on public.bairros to authenticated;
alter policy "Admins podem gerenciar banners publicitários" on public.banners_publicitarios to authenticated;
alter policy "Admins podem gerenciar categorias" on public.categorias to authenticated;
alter policy "Admins podem gerenciar categorias" on public.categorias_oportunidades to authenticated;
alter policy "Admins podem gerenciar cidades" on public.cidades to authenticated;
alter policy "Empresas podem gerenciar seus cupons" on public.cupons to authenticated;
alter policy "Admins podem gerenciar stories" on public.empresa_stories to authenticated;
alter policy "Empresas podem gerenciar seus endereços" on public.enderecos_empresa to authenticated;
alter policy "Admins podem gerenciar todos os eventos" on public.eventos to authenticated;
alter policy "Admins podem gerenciar lugares" on public.lugares_publicos to authenticated;
alter policy "Admins podem gerenciar pagamentos" on public.pagamentos_planos to authenticated;
alter policy "Admins podem gerenciar planos" on public.planos to authenticated;
alter policy "Empresas podem gerenciar seus produtos" on public.produtos to authenticated;
alter policy "Empresas podem gerenciar seus serviços" on public.servicos_agendamento to authenticated;
alter policy "Admins podem gerenciar todos os serviços" on public.servicos_autonomos to authenticated;
alter policy "Admins podem gerenciar vagas" on public.vagas_emprego to authenticated;

alter policy "Admins podem gerenciar badges" on public.badges to authenticated;
alter policy "Admins podem ver conversões" on public.conversion_events to authenticated;
alter policy "Admins podem gerenciar níveis" on public.gamification_levels to authenticated;
alter policy "Admins podem gerenciar missões" on public.missions to authenticated;
alter policy "Admins podem ver logs de notificações" on public.notificacoes_whatsapp_log to authenticated;
alter policy "Admins podem gerenciar logs de suporte" on public.suporte_logs to authenticated;
alter policy "Admins podem ver jornadas" on public.user_journey to authenticated;
alter policy "Usuários podem ver suas missões" on public.user_missions to authenticated;
alter policy "Usuários podem ver seus pontos" on public.user_points to authenticated;
alter policy "Admins podem ver todas as sessões" on public.user_sessions to authenticated;
alter policy "Admins podem ver todos os eventos" on public.user_tracking_events to authenticated;

-- Public user data is copied to a dedicated safe projection.
create table if not exists public.user_public_profiles (
  id uuid primary key references public.usuarios(id) on delete cascade,
  nome text not null,
  foto_url text,
  tipo_conta text not null,
  atualizado_em timestamptz not null default now()
);

alter table public.user_public_profiles enable row level security;
drop policy if exists "Perfis públicos podem ser visualizados" on public.user_public_profiles;
create policy "Perfis públicos podem ser visualizados"
on public.user_public_profiles
for select
to anon, authenticated
using (true);

revoke all on table public.user_public_profiles from anon, authenticated;
grant select on table public.user_public_profiles to anon, authenticated;

insert into public.user_public_profiles (id, nome, foto_url, tipo_conta, atualizado_em)
select u.id, coalesce(nullif(trim(u.nome), ''), 'Usuário'), u.foto_url, u.tipo_conta::text, now()
from public.usuarios u
on conflict (id) do update
set nome = excluded.nome,
    foto_url = excluded.foto_url,
    tipo_conta = excluded.tipo_conta,
    atualizado_em = excluded.atualizado_em;

create or replace function private.sync_user_public_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.user_public_profiles where id = old.id;
    return old;
  end if;

  insert into public.user_public_profiles (id, nome, foto_url, tipo_conta, atualizado_em)
  values (
    new.id,
    coalesce(nullif(trim(new.nome), ''), 'Usuário'),
    new.foto_url,
    new.tipo_conta::text,
    now()
  )
  on conflict (id) do update
  set nome = excluded.nome,
      foto_url = excluded.foto_url,
      tipo_conta = excluded.tipo_conta,
      atualizado_em = excluded.atualizado_em;

  return new;
end;
$$;

revoke all on function private.sync_user_public_profile() from public, anon, authenticated;
drop trigger if exists sync_user_public_profile_trigger on public.usuarios;
create trigger sync_user_public_profile_trigger
after insert or update or delete on public.usuarios
for each row execute function private.sync_user_public_profile();

-- Only the account owner or an MFA-verified administrator can read full profiles.
drop policy if exists "Permitir leitura pública de nomes de usuarios" on public.usuarios;
drop policy if exists "Usuários podem ver próprio perfil" on public.usuarios;
drop policy if exists "Usuários podem atualizar próprio perfil" on public.usuarios;
drop policy if exists "Admins podem gerenciar usuários" on public.usuarios;

create policy "Usuários podem ver próprio perfil"
on public.usuarios for select to authenticated
using (id = (select auth.uid()));

create policy "Admins com MFA podem ver usuários autorizados"
on public.usuarios for select to authenticated
using (private.admin_mfa_verified(cidade_id, false));

create policy "Usuários podem atualizar próprio perfil"
on public.usuarios for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "Admins com MFA podem atualizar usuários autorizados"
on public.usuarios for update to authenticated
using (private.admin_mfa_verified(cidade_id, false))
with check (private.admin_mfa_verified(cidade_id, false));

create policy "Somente admin geral com MFA pode excluir usuários"
on public.usuarios for delete to authenticated
using (private.admin_mfa_verified(null, true));

create or replace function private.protect_user_sensitive_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
begin
  if jwt_role = 'service_role' or private.admin_mfa_verified(old.cidade_id, false) then
    return new;
  end if;

  if (select auth.uid()) is distinct from old.id then
    raise exception 'Sem permissão para alterar este perfil' using errcode = '42501';
  end if;

  new.id := old.id;
  new.email := old.email;
  new.tipo_conta := old.tipo_conta;
  new.plano_id := old.plano_id;
  new.total_points := old.total_points;
  new.current_level := old.current_level;
  new.weekly_points := old.weekly_points;
  new.monthly_points := old.monthly_points;
  new.badges_count := old.badges_count;
  new.criado_em := old.criado_em;
  return new;
end;
$$;

revoke all on function private.protect_user_sensitive_profile_fields() from public, anon, authenticated;
drop trigger if exists protect_user_sensitive_profile_fields_trigger on public.usuarios;
create trigger protect_user_sensitive_profile_fields_trigger
before update on public.usuarios
for each row execute function private.protect_user_sensitive_profile_fields();

-- Authenticated users must not receive global analytics data.
drop policy if exists "Permitir leitura apenas para administradores" on public.estatisticas_pwa;
create policy "Admins com MFA podem ler estatísticas PWA"
on public.estatisticas_pwa for select to authenticated
using (private.admin_mfa_verified(null, false));

-- Audit records are generated by trusted server code and triggers, not browsers.
drop policy if exists "Apenas sistema pode inserir logs de auditoria" on public.audit_logs;
revoke insert on table public.audit_logs from anon, authenticated;

-- MFA is required whenever an administrator uses any sensitive table.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'achados_perdidos', 'agendamentos', 'audit_logs', 'avaliacoes', 'avisos_sistema',
    'badges', 'bairros', 'banners_publicitarios', 'canal_informativo', 'categorias',
    'categorias_oportunidades', 'categorias_problema', 'cidades', 'comentarios_problema',
    'configuracoes_sistema', 'conversion_events', 'cupons', 'empresa_stories', 'empresas',
    'enderecos_empresa', 'enquetes', 'eventos', 'gamification_levels', 'home_sections_order',
    'lugares_publicos', 'missions', 'notification_campaigns', 'notificacoes_whatsapp_log',
    'pagamentos_planos', 'planos', 'problemas_cidade', 'produtos', 'security_logs',
    'servicos_agendamento', 'servicos_autonomos', 'suporte_logs', 'user_journey',
    'user_missions', 'user_points', 'user_roles', 'user_sessions', 'user_tracking_events',
    'vagas_emprego'
  ] loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('drop policy if exists %I on public.%I', 'Administradores exigem MFA', table_name);
      execute format(
        'create policy %I on public.%I as restrictive for all to authenticated using (private.admin_mfa_policy_passes()) with check (private.admin_mfa_policy_passes())',
        'Administradores exigem MFA',
        table_name
      );
    end if;
  end loop;
end;
$$;

-- Storage writes are restricted to an owner's UUID folder or an MFA admin.
drop policy if exists "Usuários autenticados podem fazer upload" on storage.objects;
drop policy if exists "Usuários podem atualizar suas imagens" on storage.objects;
drop policy if exists "Usuários podem deletar suas imagens" on storage.objects;
drop policy if exists "Usuários podem fazer upload de imagens" on storage.objects;
drop policy if exists "Usuários podem atualizar imagens" on storage.objects;
drop policy if exists "Usuários podem deletar imagens" on storage.objects;
drop policy if exists "Admins podem fazer upload de banners" on storage.objects;
drop policy if exists "Admins podem deletar banners" on storage.objects;
drop policy if exists "Admins podem fazer upload de vídeos do canal" on storage.objects;
drop policy if exists "Admins podem atualizar vídeos do canal" on storage.objects;
drop policy if exists "Admins podem deletar vídeos do canal" on storage.objects;

create policy "Usuários enviam arquivos em sua pasta"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('imagens', 'imagens_empresas', 'imagens_eventos')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Usuários atualizam arquivos de sua pasta"
on storage.objects for update to authenticated
using (
  bucket_id in ('imagens', 'imagens_empresas', 'imagens_eventos')
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id in ('imagens', 'imagens_empresas', 'imagens_eventos')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Usuários excluem arquivos de sua pasta"
on storage.objects for delete to authenticated
using (
  bucket_id in ('imagens', 'imagens_empresas', 'imagens_eventos')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Admins com MFA enviam mídias administrativas"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('banners', 'videos_canal', 'icones_categorias', 'imagens', 'imagens_empresas', 'imagens_eventos')
  and private.admin_mfa_verified(null, false)
);

create policy "Admins com MFA atualizam mídias administrativas"
on storage.objects for update to authenticated
using (
  bucket_id in ('banners', 'videos_canal', 'icones_categorias', 'imagens', 'imagens_empresas', 'imagens_eventos')
  and private.admin_mfa_verified(null, false)
)
with check (
  bucket_id in ('banners', 'videos_canal', 'icones_categorias', 'imagens', 'imagens_empresas', 'imagens_eventos')
  and private.admin_mfa_verified(null, false)
);

create policy "Admins com MFA excluem mídias administrativas"
on storage.objects for delete to authenticated
using (
  bucket_id in ('banners', 'videos_canal', 'icones_categorias', 'imagens', 'imagens_empresas', 'imagens_eventos')
  and private.admin_mfa_verified(null, false)
);

update storage.buckets
set file_size_limit = case id
      when 'avatars' then 5242880
      when 'banners' then 10485760
      when 'icones_categorias' then 2097152
      when 'imagens_empresas' then 10485760
      when 'imagens_eventos' then 10485760
      else file_size_limit
    end,
    allowed_mime_types = case id
      when 'avatars' then array['image/jpeg','image/png','image/webp','image/gif']::text[]
      when 'banners' then array['image/jpeg','image/png','image/webp','image/gif']::text[]
      when 'icones_categorias' then array['image/jpeg','image/png','image/webp']::text[]
      when 'imagens_empresas' then array['image/jpeg','image/png','image/webp','image/gif']::text[]
      when 'imagens_eventos' then array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']::text[]
      else allowed_mime_types
    end
where id in ('avatars','banners','icones_categorias','imagens_empresas','imagens_eventos');

-- This privileged RPC must also require MFA, because it bypasses RLS.
create or replace function public.criar_resultado_sorteio(
  canal_id uuid,
  data_sorteio_param date,
  premios_param jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.admin_mfa_verified(null, false) then
    raise exception 'Autenticação administrativa em dois fatores obrigatória'
      using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.canal_informativo ci
    where ci.id = canal_id
      and ci.tipo_conteudo = 'resultado_sorteio'
      and ci.autor_id = (select auth.uid())
  ) then
    raise exception 'Publicação de sorteio inválida ou não pertencente ao usuário'
      using errcode = '42501';
  end if;

  if data_sorteio_param is null then
    raise exception 'Data do sorteio é obrigatória' using errcode = '22004';
  end if;

  if premios_param is null
     or jsonb_typeof(premios_param) <> 'array'
     or jsonb_array_length(premios_param) = 0 then
    raise exception 'Informe pelo menos um prêmio válido' using errcode = '22023';
  end if;

  insert into public.resultados_sorteio (canal_informativo_id, data_sorteio, premios)
  values (canal_id, data_sorteio_param, premios_param);
end;
$$;

revoke all on function public.criar_resultado_sorteio(uuid, date, jsonb) from public, anon;
grant execute on function public.criar_resultado_sorteio(uuid, date, jsonb) to authenticated, service_role;
