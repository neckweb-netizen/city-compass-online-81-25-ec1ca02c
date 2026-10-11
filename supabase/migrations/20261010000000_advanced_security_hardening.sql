-- Advanced security hardening for public RPCs and delegated administration.

create table if not exists private.responsibility_request_limits (
  user_id uuid not null,
  empresa_id uuid not null,
  last_requested_at timestamptz not null default now(),
  primary key (user_id, empresa_id)
);
alter table private.responsibility_request_limits enable row level security;
revoke all on private.responsibility_request_limits from public, anon, authenticated;

create or replace function public.create_responsibility_request_notification(
  p_empresa_id uuid,
  p_empresa_nome text,
  p_nome text,
  p_telefone text,
  p_whatsapp text default null,
  p_email text default null,
  p_observacoes text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_count integer;
  v_empresa_nome text;
  v_cidade_id uuid;
  v_last_requested_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'Autenticação obrigatória' using errcode = '42501';
  end if;
  if p_empresa_id is null
    or char_length(trim(coalesce(p_nome, ''))) not between 2 and 120
    or char_length(regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g')) not between 8 and 15
    or char_length(regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g')) > 15
    or char_length(trim(coalesce(p_email, ''))) > 254
    or char_length(coalesce(p_observacoes, '')) > 1000
  then
    raise exception 'Dados da solicitação inválidos' using errcode = '22023';
  end if;
  if nullif(trim(coalesce(p_email, '')), '') is not null
    and trim(p_email) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  then
    raise exception 'E-mail inválido' using errcode = '22023';
  end if;

  select e.nome, e.cidade_id into v_empresa_nome, v_cidade_id
  from public.empresas e
  where e.id = p_empresa_id and e.ativo is true and e.status_aprovacao::text = 'aprovado';
  if v_empresa_nome is null then
    raise exception 'Empresa indisponível' using errcode = 'P0002';
  end if;
  if exists (
    select 1 from public.empresas e
    where e.id = p_empresa_id and e.usuario_id = v_user_id
  ) or exists (
    select 1 from public.usuario_empresa_admin a
    where a.empresa_id = p_empresa_id and a.usuario_id = v_user_id and a.ativo is true
  ) then
    raise exception 'Sua conta já administra esta empresa' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':' || p_empresa_id::text, 0));
  select r.last_requested_at into v_last_requested_at
  from private.responsibility_request_limits r
  where r.user_id = v_user_id and r.empresa_id = p_empresa_id;
  if v_last_requested_at > now() - interval '24 hours' then
    raise exception 'Solicitação já enviada. Aguarde 24 horas para tentar novamente' using errcode = 'P0001';
  end if;

  insert into private.responsibility_request_limits (user_id, empresa_id, last_requested_at)
  values (v_user_id, p_empresa_id, now())
  on conflict (user_id, empresa_id) do update set last_requested_at = excluded.last_requested_at;

  insert into public.notifications (
    user_id, title, message, category, priority, action_url, action_label, metadata
  )
  select
    u.id,
    'Solicitação de responsabilidade',
    left(trim(p_nome) || ' solicitou acesso à empresa "' || v_empresa_nome || '".', 1000),
    'account', 'high', '/admin/local-admins', 'Analisar solicitação',
    jsonb_strip_nulls(jsonb_build_object(
      'event', 'responsibility_request', 'company_id', p_empresa_id,
      'requester_id', v_user_id, 'requester_name', left(trim(p_nome), 120),
      'phone', regexp_replace(p_telefone, '\D', '', 'g'),
      'whatsapp', nullif(regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g'), ''),
      'email', nullif(left(trim(coalesce(p_email, '')), 254), ''),
      'notes', nullif(left(trim(coalesce(p_observacoes, '')), 1000), '')
    ))
  from public.usuarios u
  where u.tipo_conta::text = 'admin_geral'
     or (u.tipo_conta::text = 'admin_cidade' and u.cidade_id = v_cidade_id);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.create_responsibility_request_notification(uuid,text,text,text,text,text,text) from public, anon;
grant execute on function public.create_responsibility_request_notification(uuid,text,text,text,text,text,text) to authenticated;

create table if not exists private.tool_view_rate_limits (
  tool_slug text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0,
  primary key (tool_slug, window_started_at)
);
alter table private.tool_view_rate_limits enable row level security;
revoke all on private.tool_view_rate_limits from public, anon, authenticated;

create or replace function public.increment_tool_view(p_tool_slug text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := date_trunc('minute', clock_timestamp());
  v_requests integer;
  v_count bigint;
begin
  if p_tool_slug is null or p_tool_slug not in (
    'gerador-rifa','gerador-cobranca','criador-curriculo','gestao-cobrancas',
    'calculadora-orcamento','calculadora-margem','simulador-rescisao','leitor-voz','consulta-fipe'
  ) then return null; end if;

  insert into private.tool_view_rate_limits(tool_slug, window_started_at, request_count)
  values (p_tool_slug, v_window, 1)
  on conflict (tool_slug, window_started_at) do update
    set request_count = private.tool_view_rate_limits.request_count + 1
  returning request_count into v_requests;

  if v_requests > 1000 then
    select t.view_count into v_count from public.tool_view_counts t where t.tool_slug = p_tool_slug;
    return coalesce(v_count, 0);
  end if;

  insert into public.tool_view_counts(tool_slug, view_count, updated_at)
  values (p_tool_slug, 1, now())
  on conflict (tool_slug) do update
    set view_count = public.tool_view_counts.view_count + 1, updated_at = now()
  returning view_count into v_count;

  if random() < 0.002 then
    delete from private.tool_view_rate_limits where window_started_at < now() - interval '2 hours';
  end if;
  return v_count;
end;
$$;
revoke all on function public.increment_tool_view(text) from public;
grant execute on function public.increment_tool_view(text) to anon, authenticated;

create or replace function public.criar_agendamento_publico(
  p_empresa_id uuid, p_nome_cliente text, p_telefone_cliente text, p_servico text,
  p_data_agendamento timestamptz, p_observacoes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid; v_phone text; v_phone_bucket text; v_company_bucket text; v_count integer;
begin
  v_phone := regexp_replace(coalesce(p_telefone_cliente, ''), '\D', '', 'g');
  if p_empresa_id is null or p_data_agendamento is null
     or char_length(trim(coalesce(p_nome_cliente, ''))) not between 2 and 120
     or char_length(v_phone) not between 8 and 15
     or char_length(trim(coalesce(p_servico, ''))) not between 2 and 160
     or char_length(coalesce(p_observacoes, '')) > 1000
     or p_data_agendamento <= now() - interval '5 minutes'
     or p_data_agendamento > now() + interval '1 year'
  then raise exception 'Dados do agendamento inválidos' using errcode = '22023'; end if;
  if not exists (
    select 1 from public.empresas e
    where e.id = p_empresa_id and e.ativo is true and e.status_aprovacao::text = 'aprovado'
  ) then raise exception 'Empresa indisponível' using errcode = 'P0002'; end if;

  v_phone_bucket := encode(extensions.digest('phone:' || p_empresa_id::text || ':' || v_phone || ':' || date_trunc('hour',now())::text,'sha256'),'hex');
  v_company_bucket := encode(extensions.digest('company:' || p_empresa_id::text || ':' || date_trunc('hour',now())::text,'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended(v_company_bucket, 0));

  insert into private.appointment_request_limits(bucket,request_count,window_started_at)
  values(v_company_bucket,1,date_trunc('hour',now()))
  on conflict(bucket) do update set request_count=private.appointment_request_limits.request_count+1
  returning request_count into v_count;
  if v_count > 60 then raise exception 'Limite temporário de agendamentos atingido' using errcode='P0001'; end if;

  insert into private.appointment_request_limits(bucket,request_count,window_started_at)
  values(v_phone_bucket,1,date_trunc('hour',now()))
  on conflict(bucket) do update set request_count=private.appointment_request_limits.request_count+1
  returning request_count into v_count;
  if v_count > 5 then raise exception 'Muitas tentativas de agendamento. Aguarde antes de tentar novamente' using errcode='P0001'; end if;

  insert into public.agendamentos(empresa_id,nome_cliente,telefone_cliente,servico,data_agendamento,observacoes,status,cliente_usuario_id)
  values(p_empresa_id,trim(p_nome_cliente),v_phone,trim(p_servico),p_data_agendamento,nullif(trim(p_observacoes),''),'pendente',(select auth.uid()))
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.criar_agendamento_publico(uuid,text,text,text,timestamptz,text) from public;
grant execute on function public.criar_agendamento_publico(uuid,text,text,text,timestamptz,text) to anon, authenticated;

-- Internal implementations are only reached through their validated wrappers.
revoke all on function private.create_short_url_internal(text) from public, anon, authenticated;
revoke all on function private.resolve_short_url_internal(text) from public, anon, authenticated;
grant execute on function private.create_short_url_internal(text) to service_role;
grant execute on function private.resolve_short_url_internal(text) to service_role;

drop policy if exists "Admin cidade can manage non-admin roles" on public.user_roles;
create policy "Admin cidade can manage non-admin roles" on public.user_roles
for insert to authenticated
with check (
  public.has_role((select auth.uid()), 'admin_cidade'::public.app_role)
  and role <> all (array['admin_geral'::public.app_role, 'admin_cidade'::public.app_role])
  and exists (
    select 1 from public.usuarios actor cross join public.usuarios target
    where actor.id = (select auth.uid()) and target.id = user_roles.user_id
      and actor.cidade_id is not null and target.cidade_id = actor.cidade_id
  )
);

drop policy if exists "Admin cidade can update non-admin roles" on public.user_roles;
create policy "Admin cidade can update non-admin roles" on public.user_roles
for update to authenticated
using (
  public.has_role((select auth.uid()), 'admin_cidade'::public.app_role)
  and role <> all (array['admin_geral'::public.app_role, 'admin_cidade'::public.app_role])
  and exists (
    select 1 from public.usuarios actor cross join public.usuarios target
    where actor.id = (select auth.uid()) and target.id = user_roles.user_id
      and actor.cidade_id is not null and target.cidade_id = actor.cidade_id
  )
)
with check (
  public.has_role((select auth.uid()), 'admin_cidade'::public.app_role)
  and role <> all (array['admin_geral'::public.app_role, 'admin_cidade'::public.app_role])
  and exists (
    select 1 from public.usuarios actor cross join public.usuarios target
    where actor.id = (select auth.uid()) and target.id = user_roles.user_id
      and actor.cidade_id is not null and target.cidade_id = actor.cidade_id
  )
);

drop policy if exists "Permitir atualizacao de empresas por administradores" on public.empresas;
