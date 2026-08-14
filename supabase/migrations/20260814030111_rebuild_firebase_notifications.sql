-- Sistema unificado de notificacoes: Supabase + Firebase Cloud Messaging.
-- Preserva as notificacoes e tokens FCM existentes, remove OneSignal e a tabela legada.

create extension if not exists pgcrypto;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- Interrompe os disparos antigos antes de migrar os dados.
drop trigger if exists trigger_send_fcm_on_notification on public.notifications;
drop trigger if exists trigger_send_fcm_on_notificacao on public.notificacoes;
drop function if exists public.send_fcm_notification_on_insert();
drop function if exists public.send_fcm_on_notificacao_insert();

-- Campanhas criadas pelo painel administrativo.
create table if not exists public.notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null,
  message text not null,
  category text not null default 'system',
  priority text not null default 'normal',
  image_url text,
  icon_url text,
  action_url text,
  action_label text,
  audience_type text not null default 'all',
  target_user_ids uuid[] not null default '{}'::uuid[],
  channels jsonb not null default '{"in_app":true,"push":true}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  total_recipients integer not null default 0,
  total_deliveries integer not null default 0,
  total_sent integer not null default 0,
  total_failed integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_campaigns_title_length check (char_length(title) between 1 and 120),
  constraint notification_campaigns_message_length check (char_length(message) between 1 and 1000),
  constraint notification_campaigns_category_check check (category in ('system', 'marketing', 'events', 'security', 'account', 'community')),
  constraint notification_campaigns_priority_check check (priority in ('low', 'normal', 'high', 'urgent')),
  constraint notification_campaigns_audience_check check (audience_type in ('all', 'users', 'businesses', 'admins', 'specific')),
  constraint notification_campaigns_status_check check (status in ('draft', 'scheduled', 'queued', 'processing', 'completed', 'partial', 'failed', 'cancelled')),
  constraint notification_campaigns_channels_object check (jsonb_typeof(channels) = 'object'),
  constraint notification_campaigns_metadata_object check (jsonb_typeof(metadata) = 'object')
);

-- Evolui a tabela principal sem descartar o historico existente.
alter table public.notifications
  add column if not exists category text not null default 'system',
  add column if not exists priority text not null default 'normal',
  add column if not exists action_url text,
  add column if not exists action_label text,
  add column if not exists image_url text,
  add column if not exists icon_url text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists read_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists campaign_id uuid,
  add column if not exists created_by uuid;

update public.notifications
set
  read = coalesce(read, false),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, created_at, now()),
  read_at = case when coalesce(read, false) then coalesce(read_at, updated_at, created_at, now()) else null end,
  metadata = coalesce(metadata, '{}'::jsonb);

alter table public.notifications
  alter column read set default false,
  alter column read set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null,
  alter column metadata set default '{}'::jsonb,
  alter column metadata set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'notifications_user_id_fkey'
      and conrelid = 'public.notifications'::regclass
  ) then
    alter table public.notifications
      add constraint notifications_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'notifications_campaign_id_fkey'
      and conrelid = 'public.notifications'::regclass
  ) then
    alter table public.notifications
      add constraint notifications_campaign_id_fkey
      foreign key (campaign_id) references public.notification_campaigns(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'notifications_created_by_fkey'
      and conrelid = 'public.notifications'::regclass
  ) then
    alter table public.notifications
      add constraint notifications_created_by_fkey
      foreign key (created_by) references auth.users(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'notifications_category_check'
      and conrelid = 'public.notifications'::regclass
  ) then
    alter table public.notifications add constraint notifications_category_check
      check (category in ('system', 'marketing', 'events', 'security', 'account', 'community'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'notifications_priority_check'
      and conrelid = 'public.notifications'::regclass
  ) then
    alter table public.notifications add constraint notifications_priority_check
      check (priority in ('low', 'normal', 'high', 'urgent'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'notifications_metadata_object'
      and conrelid = 'public.notifications'::regclass
  ) then
    alter table public.notifications add constraint notifications_metadata_object
      check (jsonb_typeof(metadata) = 'object');
  end if;
end $$;

-- Migra a tabela em portugues para a fonte unica.
do $$
begin
  if to_regclass('public.notificacoes') is not null then
    insert into public.notifications (
      id, user_id, title, message, category, read, read_at, created_at, updated_at,
      action_url, metadata
    )
    select
      n.id,
      n.usuario_id,
      n.titulo,
      n.conteudo,
      case
        when n.tipo = 'evento' then 'events'
        when n.tipo in ('badge_earned', 'level_up') then 'account'
        else 'system'
      end,
      n.lida,
      case when n.lida then n.criada_em else null end,
      n.criada_em,
      n.criada_em,
      null,
      jsonb_strip_nulls(jsonb_build_object(
        'legacy_type', n.tipo,
        'reference_id', n.referencia_id,
        'reference_type', n.referencia_tipo
      ))
    from public.notificacoes n
    on conflict (id) do nothing;
  end if;
end $$;

-- Preferencias reais por usuario.
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  in_app_enabled boolean not null default true,
  push_enabled boolean not null default true,
  system_enabled boolean not null default true,
  marketing_enabled boolean not null default true,
  events_enabled boolean not null default true,
  community_enabled boolean not null default true,
  quiet_hours_enabled boolean not null default false,
  quiet_hours_start time,
  quiet_hours_end time,
  timezone text not null default 'America/Bahia',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_preferences_quiet_hours check (
    not quiet_hours_enabled or (quiet_hours_start is not null and quiet_hours_end is not null)
  )
);

-- Dispositivos Firebase. Novos clientes usam FID; tokens antigos continuam validos na transicao.
create table if not exists public.notification_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  registration_id text not null unique,
  target_type text not null default 'fid',
  platform text not null default 'web',
  device_name text,
  user_agent text,
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_devices_target_type_check check (target_type in ('fid', 'token')),
  constraint notification_devices_platform_check check (platform in ('web', 'pwa', 'android', 'ios')),
  constraint notification_devices_registration_length check (char_length(registration_id) between 10 and 4096)
);

do $$
begin
  if to_regclass('public.user_fcm_tokens') is not null then
    insert into public.notification_devices (
      id, user_id, registration_id, target_type, platform, device_name,
      enabled, last_seen_at, created_at, updated_at
    )
    select distinct on (t.fcm_token)
      t.id, t.user_id, t.fcm_token, 'token', 'web', t.device_info,
      true, coalesce(t.updated_at, now()), coalesce(t.created_at, now()), coalesce(t.updated_at, now())
    from public.user_fcm_tokens t
    order by t.fcm_token, t.updated_at desc, t.created_at desc
    on conflict (registration_id) do update
      set user_id = excluded.user_id,
          last_seen_at = excluded.last_seen_at,
          updated_at = excluded.updated_at;
  end if;
end $$;

-- Auditoria de cada tentativa de entrega.
create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  device_id uuid references public.notification_devices(id) on delete set null,
  channel text not null default 'push',
  status text not null default 'queued',
  attempt_count integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  provider_message_id text,
  error_code text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_deliveries_channel_check check (channel in ('push')),
  constraint notification_deliveries_status_check check (status in ('queued', 'processing', 'sent', 'failed', 'skipped')),
  constraint notification_deliveries_attempts_check check (attempt_count between 0 and 10),
  constraint notification_deliveries_notification_device_key unique (notification_id, device_id)
);

alter table public.notification_deliveries
  add column if not exists campaign_id uuid references public.notification_campaigns(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'notifications_campaign_user_key'
      and conrelid = 'public.notifications'::regclass
  ) then
    alter table public.notifications
      add constraint notifications_campaign_user_key unique (campaign_id, user_id);
  end if;
end $$;

-- Segredo gerado no banco e nunca exposto pela Data API. O cron o usa para chamar o worker.
create table if not exists public.notification_internal_settings (
  setting_key text primary key,
  secret_value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.notification_internal_settings (setting_key, secret_value)
values ('worker_secret', encode(gen_random_bytes(32), 'hex'))
on conflict (setting_key) do nothing;

-- Indices alinhados às consultas da interface, fila e historico.
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc)
  where archived_at is null;
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read = false and archived_at is null;
create index if not exists notifications_campaign_id_idx
  on public.notifications (campaign_id)
  where campaign_id is not null;
create index if not exists notification_campaigns_status_schedule_idx
  on public.notification_campaigns (status, scheduled_at, created_at);
create index if not exists notification_devices_user_enabled_idx
  on public.notification_devices (user_id, last_seen_at desc)
  where enabled = true and revoked_at is null;
create index if not exists notification_deliveries_queue_idx
  on public.notification_deliveries (status, next_attempt_at, created_at)
  where status in ('queued', 'failed');
create index if not exists notification_deliveries_notification_id_idx
  on public.notification_deliveries (notification_id);
create index if not exists notification_deliveries_campaign_id_idx
  on public.notification_deliveries (campaign_id)
  where campaign_id is not null;

-- RLS e privilegios minimos.
alter table public.notifications enable row level security;
alter table public.notification_campaigns enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_devices enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.notification_internal_settings enable row level security;

drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Users can update their own notifications" on public.notifications;
drop policy if exists "Sistema pode criar notificações" on public.notifications;
drop policy if exists "Somente service role pode criar notifications do sistema" on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy notifications_update_own on public.notifications
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists notification_campaigns_admin_select on public.notification_campaigns;
create policy notification_campaigns_admin_select on public.notification_campaigns
  for select to authenticated
  using (exists (
    select 1 from public.usuarios u
    where u.id = (select auth.uid())
      and u.tipo_conta::text in ('admin_geral', 'admin_cidade')
  ));

drop policy if exists notification_preferences_select_own on public.notification_preferences;
drop policy if exists notification_preferences_insert_own on public.notification_preferences;
drop policy if exists notification_preferences_update_own on public.notification_preferences;
create policy notification_preferences_select_own on public.notification_preferences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy notification_preferences_insert_own on public.notification_preferences
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy notification_preferences_update_own on public.notification_preferences
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists notification_devices_select_own on public.notification_devices;
drop policy if exists notification_devices_insert_own on public.notification_devices;
drop policy if exists notification_devices_update_own on public.notification_devices;
drop policy if exists notification_devices_delete_own on public.notification_devices;
create policy notification_devices_select_own on public.notification_devices
  for select to authenticated using ((select auth.uid()) = user_id);
create policy notification_devices_insert_own on public.notification_devices
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy notification_devices_update_own on public.notification_devices
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy notification_devices_delete_own on public.notification_devices
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.notifications from anon, authenticated;
revoke all on public.notification_campaigns from anon, authenticated;
revoke all on public.notification_preferences from anon, authenticated;
revoke all on public.notification_devices from anon, authenticated;
revoke all on public.notification_deliveries from anon, authenticated;
revoke all on public.notification_internal_settings from anon, authenticated;

grant select on public.notifications to authenticated;
grant update (read, read_at, archived_at) on public.notifications to authenticated;
grant select on public.notification_campaigns to authenticated;
grant select, insert, update, delete on public.notification_preferences to authenticated;
grant select, insert, update, delete on public.notification_devices to authenticated;

create or replace function public.register_notification_device(
  p_registration_id text,
  p_target_type text default 'fid',
  p_platform text default 'web',
  p_device_name text default null,
  p_user_agent text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_device_id uuid;
begin
  if v_user_id is null then raise exception 'Autenticação obrigatória'; end if;
  if char_length(trim(coalesce(p_registration_id, ''))) not between 10 and 4096 then
    raise exception 'Identificador Firebase inválido';
  end if;
  if p_target_type not in ('fid', 'token') then raise exception 'Tipo de destino inválido'; end if;
  if p_platform not in ('web', 'pwa', 'android', 'ios') then raise exception 'Plataforma inválida'; end if;

  insert into public.notification_devices (
    user_id, registration_id, target_type, platform, device_name, user_agent,
    enabled, revoked_at, last_seen_at, updated_at
  ) values (
    v_user_id, trim(p_registration_id), p_target_type, p_platform,
    left(nullif(trim(coalesce(p_device_name, '')), ''), 200),
    left(nullif(trim(coalesce(p_user_agent, '')), ''), 1000),
    true, null, now(), now()
  )
  on conflict (registration_id) do update
    set user_id = v_user_id,
        target_type = excluded.target_type,
        platform = excluded.platform,
        device_name = excluded.device_name,
        user_agent = excluded.user_agent,
        enabled = true,
        revoked_at = null,
        last_seen_at = now(),
        updated_at = now()
  returning id into v_device_id;
  return v_device_id;
end;
$$;

revoke all on function public.register_notification_device(text, text, text, text, text) from public, anon;
grant execute on function public.register_notification_device(text, text, text, text, text) to authenticated;

create or replace function public.unregister_notification_device(p_registration_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  if auth.uid() is null then raise exception 'Autenticação obrigatória'; end if;
  update public.notification_devices
    set enabled = false, revoked_at = now(), updated_at = now()
    where user_id = auth.uid() and registration_id = trim(p_registration_id);
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

revoke all on function public.unregister_notification_device(text) from public, anon;
grant execute on function public.unregister_notification_device(text) to authenticated;

-- Reivindicacao atomica com SKIP LOCKED evita envio duplicado entre cron e disparo imediato.
create or replace function public.claim_notification_campaigns(
  p_campaign_id uuid default null,
  p_limit integer default 5
)
returns setof public.notification_campaigns
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with candidates as (
    select c.id
    from public.notification_campaigns c
    where (
        (c.status in ('scheduled', 'queued') and coalesce(c.scheduled_at, c.created_at) <= now())
        or (c.status = 'processing' and c.started_at < now() - interval '10 minutes')
      )
      and (p_campaign_id is null or c.id = p_campaign_id)
    order by coalesce(c.scheduled_at, c.created_at), c.created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 5), 20))
  )
  update public.notification_campaigns c
    set status = 'processing',
        started_at = coalesce(c.started_at, now()),
        last_error = null
  from candidates
  where c.id = candidates.id
  returning c.*;
end;
$$;

revoke all on function public.claim_notification_campaigns(uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_notification_campaigns(uuid, integer) to service_role;

create or replace function public.claim_notification_deliveries(p_limit integer default 100)
returns setof public.notification_deliveries
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with candidates as (
    select d.id
    from public.notification_deliveries d
    where d.status in ('queued', 'failed')
      and d.next_attempt_at <= now()
      and d.attempt_count < 5
    order by d.next_attempt_at, d.created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 100), 500))
  )
  update public.notification_deliveries d
    set status = 'processing',
        attempt_count = d.attempt_count + 1,
        updated_at = now()
  from candidates
  where d.id = candidates.id
  returning d.*;
end;
$$;

revoke all on function public.claim_notification_deliveries(integer) from public, anon, authenticated;
grant execute on function public.claim_notification_deliveries(integer) to service_role;

-- Timestamps sem SECURITY DEFINER.
create or replace function public.set_notification_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_notifications_updated_at on public.notifications;
create trigger update_notifications_updated_at
before update on public.notifications
for each row execute function public.set_notification_updated_at();

create trigger update_notification_campaigns_updated_at
before update on public.notification_campaigns
for each row execute function public.set_notification_updated_at();
create trigger update_notification_preferences_updated_at
before update on public.notification_preferences
for each row execute function public.set_notification_updated_at();
create trigger update_notification_devices_updated_at
before update on public.notification_devices
for each row execute function public.set_notification_updated_at();
create trigger update_notification_deliveries_updated_at
before update on public.notification_deliveries
for each row execute function public.set_notification_updated_at();

-- Garante consistencia entre o booleano e o horario de leitura.
create or replace function public.sync_notification_read_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.read and (old.read is distinct from true or new.read_at is null) then
    new.read_at = coalesce(new.read_at, now());
  elsif not new.read then
    new.read_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_notification_read_at on public.notifications;
create trigger sync_notification_read_at
before update of read, read_at on public.notifications
for each row execute function public.sync_notification_read_at();

-- Toda notificacao nova entra na fila FCM dos dispositivos ativos do destinatario.
create or replace function public.queue_notification_deliveries()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notification_deliveries (
    notification_id, device_id, campaign_id, channel, status, next_attempt_at
  )
  select
    new.id,
    d.id,
    new.campaign_id,
    'push',
    'queued',
    now()
  from public.notification_devices d
  left join public.notification_preferences p on p.user_id = d.user_id
  left join public.notification_campaigns c on c.id = new.campaign_id
  where d.user_id = new.user_id
    and d.enabled = true
    and d.revoked_at is null
    and coalesce(p.push_enabled, true)
    and case new.category
      when 'marketing' then coalesce(p.marketing_enabled, true)
      when 'events' then coalesce(p.events_enabled, true)
      when 'community' then coalesce(p.community_enabled, true)
      else coalesce(p.system_enabled, true)
    end
    and (new.campaign_id is null or coalesce((c.channels ->> 'push')::boolean, true))
  on conflict (notification_id, device_id) do nothing;
  return new;
end;
$$;

revoke all on function public.queue_notification_deliveries() from public, anon, authenticated;
drop trigger if exists queue_notification_deliveries on public.notifications;
create trigger queue_notification_deliveries
after insert on public.notifications
for each row execute function public.queue_notification_deliveries();

-- Evento de dominio: status da empresa.
create or replace function public.notificar_status_empresa()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status_aprovacao is distinct from new.status_aprovacao and new.usuario_id is not null then
    if new.status_aprovacao = 'aprovado' then
      insert into public.notifications (
        user_id, title, message, category, priority, action_url, action_label, metadata
      ) values (
        new.usuario_id,
        'Empresa aprovada!',
        'Parabéns! Sua empresa "' || new.nome || '" foi aprovada e já está visível no guia.',
        'account', 'high', '/empresa-dashboard', 'Acessar empresa',
        jsonb_build_object('event', 'company_approved', 'company_id', new.id)
      );
    elsif new.status_aprovacao = 'rejeitado' then
      insert into public.notifications (
        user_id, title, message, category, priority, action_url, action_label, metadata
      ) values (
        new.usuario_id,
        'Empresa rejeitada',
        'Sua empresa "' || new.nome || '" foi rejeitada. ' ||
          case when nullif(new.observacoes_admin, '') is not null
            then 'Motivo: ' || new.observacoes_admin
            else 'Entre em contato com o administrador para mais informações.' end,
        'account', 'high', '/empresa-dashboard', 'Ver detalhes',
        jsonb_build_object('event', 'company_rejected', 'company_id', new.id)
      );
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.notificar_status_empresa() from public, anon, authenticated;

-- RPC segura para o pedido de responsabilidade, notificando os administradores corretos.
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
begin
  if v_user_id is null then
    raise exception 'Autenticação obrigatória';
  end if;
  if p_empresa_id is null or char_length(trim(coalesce(p_empresa_nome, ''))) not between 1 and 200 then
    raise exception 'Empresa inválida';
  end if;
  if char_length(trim(coalesce(p_nome, ''))) not between 2 and 120 then
    raise exception 'Nome inválido';
  end if;
  if char_length(trim(coalesce(p_telefone, ''))) not between 8 and 30 then
    raise exception 'Telefone inválido';
  end if;

  insert into public.notifications (
    user_id, title, message, category, priority, action_url, action_label, metadata
  )
  select
    u.id,
    'Solicitação de responsabilidade',
    left(trim(p_nome) || ' solicitou acesso à empresa "' || trim(p_empresa_nome) || '".', 1000),
    'account',
    'high',
    '/admin/local-admins',
    'Analisar solicitação',
    jsonb_strip_nulls(jsonb_build_object(
      'event', 'responsibility_request',
      'company_id', p_empresa_id,
      'requester_id', v_user_id,
      'requester_name', left(trim(p_nome), 120),
      'phone', left(trim(p_telefone), 30),
      'whatsapp', left(trim(coalesce(p_whatsapp, '')), 30),
      'email', left(trim(coalesce(p_email, '')), 254),
      'notes', left(trim(coalesce(p_observacoes, '')), 1000)
    ))
  from public.usuarios u
  where u.tipo_conta::text in ('admin_geral', 'admin_cidade');

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.create_responsibility_request_notification(uuid, text, text, text, text, text, text) from public, anon;
grant execute on function public.create_responsibility_request_notification(uuid, text, text, text, text, text, text) to authenticated;

-- Atualiza as duas rotinas de gamificacao que ainda escreviam na tabela legada.
create or replace function public.add_user_points(
  p_user_id uuid,
  p_points integer,
  p_action_type text,
  p_action_description text default null,
  p_reference_id uuid default null,
  p_reference_type text default null
)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_old_level integer;
  v_new_level integer;
  v_total_points integer;
begin
  select current_level into v_old_level from public.usuarios where id = p_user_id;
  insert into public.user_points (user_id, points, action_type, action_description, reference_id, reference_type)
  values (p_user_id, p_points, p_action_type, p_action_description, p_reference_id, p_reference_type);
  v_total_points := public.calculate_user_total_points(p_user_id);
  v_new_level := public.calculate_user_level(v_total_points);
  update public.usuarios
    set total_points = v_total_points, current_level = v_new_level, last_activity_date = current_date
    where id = p_user_id;
  if v_new_level > coalesce(v_old_level, 0) then
    insert into public.notifications (user_id, title, message, category, priority, metadata)
    values (
      p_user_id,
      '🎉 Parabéns! Você subiu de nível!',
      'Você alcançou o nível ' || v_new_level || '!',
      'account', 'normal',
      jsonb_build_object('event', 'level_up', 'level', v_new_level)
    );
  end if;
end;
$$;

create or replace function public.check_and_award_badges(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_badge record;
  v_count integer;
  v_has_badge boolean;
begin
  for v_badge in select * from public.badges where is_active = true loop
    select exists(
      select 1 from public.user_badges where user_id = p_user_id and badge_id = v_badge.id
    ) into v_has_badge;
    if not v_has_badge then
      case v_badge.requirement_type
        when 'avaliacoes' then select count(*) into v_count from public.avaliacoes where usuario_id = p_user_id;
        when 'problemas_cidade' then select count(*) into v_count from public.problemas_cidade where usuario_id = p_user_id;
        when 'problemas_resolvidos' then select count(*) into v_count from public.problemas_cidade where usuario_id = p_user_id and status = 'resolvido';
        when 'agendamentos' then
          select count(*) into v_count from public.agendamentos a join public.empresas e on a.empresa_id = e.id where e.usuario_id = p_user_id;
        when 'favoritos' then select count(*) into v_count from public.favoritos where usuario_id = p_user_id;
        when 'comentarios' then select count(*) into v_count from public.comentarios_problema where usuario_id = p_user_id;
        else v_count := 0;
      end case;

      if v_count >= v_badge.requirement_count then
        insert into public.user_badges (user_id, badge_id, progress)
        values (p_user_id, v_badge.id, v_count);
        if v_badge.points_reward > 0 then
          perform public.add_user_points(
            p_user_id, v_badge.points_reward, 'badge_earned',
            'Conquistou o badge: ' || v_badge.name, v_badge.id, 'badge'
          );
        end if;
        insert into public.notifications (user_id, title, message, category, priority, metadata)
        values (
          p_user_id, '🏆 Nova conquista!',
          'Você conquistou o badge "' || v_badge.name || '"!',
          'account', 'normal',
          jsonb_build_object('event', 'badge_earned', 'badge_id', v_badge.id)
        );
      end if;
    end if;
  end loop;
  update public.usuarios
    set badges_count = (select count(*) from public.user_badges where user_id = p_user_id)
    where id = p_user_id;
end;
$$;

-- Remove tabelas e funcoes dos provedores antigos depois da copia.
drop table if exists public.notificacoes cascade;
drop table if exists public.user_fcm_tokens cascade;
drop table if exists public.user_push_tokens cascade;
drop function if exists public.update_user_push_tokens_updated_at();
drop function if exists public.update_notifications_updated_at();

-- Remove configuracoes OneSignal apenas em instalações com o esquema chave/valor antigo.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'configuracoes_sistema' and column_name = 'chave'
  ) then
    execute $sql$
      delete from public.configuracoes_sistema
      where chave in ('onesignal_app_id', 'onesignal_safari_web_id', 'onesignal_rest_api_key')
    $sql$;
  end if;
end $$;

-- Realtime somente para a caixa de notificacoes do usuario.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

-- Worker a cada minuto para campanhas agendadas, filas e novas notificacoes de dominio.
do $$
declare
  v_job_id bigint;
begin
  select jobid into v_job_id from cron.job where jobname = 'process-firebase-notification-queue';
  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;
end $$;

select cron.schedule(
  'process-firebase-notification-queue',
  '* * * * *',
  $cron$
    select net.http_post(
      url := 'https://uyleozhwzngnvyddfvni.supabase.co/functions/v1/send-fcm-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-notification-worker-key', (
          select secret_value from public.notification_internal_settings where setting_key = 'worker_secret'
        )
      ),
      body := '{"action":"process"}'::jsonb,
      timeout_milliseconds := 50000
    );
  $cron$
);
