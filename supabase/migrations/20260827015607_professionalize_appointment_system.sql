alter table public.empresas
  add column if not exists agendamento_intervalo_minutos integer not null default 30,
  add column if not exists agendamento_hora_inicio time not null default '08:00',
  add column if not exists agendamento_hora_fim time not null default '18:00',
  add column if not exists agendamento_dias_semana smallint[] not null default array[1,2,3,4,5,6]::smallint[],
  add column if not exists agendamento_antecedencia_minutos integer not null default 60,
  add column if not exists agendamento_max_dias integer not null default 60;

alter table public.empresas
  drop constraint if exists empresas_agendamento_intervalo_check,
  add constraint empresas_agendamento_intervalo_check check (agendamento_intervalo_minutos in (15,20,30,45,60,90,120)),
  drop constraint if exists empresas_agendamento_horas_check,
  add constraint empresas_agendamento_horas_check check (agendamento_hora_fim > agendamento_hora_inicio),
  drop constraint if exists empresas_agendamento_antecedencia_check,
  add constraint empresas_agendamento_antecedencia_check check (agendamento_antecedencia_minutos between 0 and 10080),
  drop constraint if exists empresas_agendamento_max_dias_check,
  add constraint empresas_agendamento_max_dias_check check (agendamento_max_dias between 1 and 365);

alter table public.agendamentos
  add column if not exists servico_id uuid references public.servicos_agendamento(id) on delete set null,
  add column if not exists duracao_minutos integer not null default 60,
  add column if not exists cliente_usuario_id uuid references auth.users(id) on delete set null;

update public.agendamentos a
set servico_id = s.id,
    duracao_minutos = s.duracao_minutos
from public.servicos_agendamento s
where s.empresa_id = a.empresa_id
  and lower(trim(s.nome_servico)) = lower(trim(a.servico))
  and a.servico_id is null;

alter table public.agendamentos
  drop constraint if exists agendamentos_status_check,
  add constraint agendamentos_status_check check (status in ('pendente','confirmado','cancelado','concluido')),
  drop constraint if exists agendamentos_duracao_check,
  add constraint agendamentos_duracao_check check (duracao_minutos between 5 and 1440);

create index if not exists idx_agendamentos_empresa_data_ativos
  on public.agendamentos (empresa_id, data_agendamento)
  where status in ('pendente','confirmado');

create or replace function public.validar_agendamento_antes_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_empresa public.empresas%rowtype;
  v_servico public.servicos_agendamento%rowtype;
  v_data_local timestamp;
  v_data_fim timestamptz;
begin
  select * into v_empresa from public.empresas
  where id = new.empresa_id and ativo = true and status_aprovacao = 'aprovado' and agendamentos_ativo = true;
  if not found then raise exception 'Esta empresa não está aceitando agendamentos no momento'; end if;

  select * into v_servico from public.servicos_agendamento
  where empresa_id = new.empresa_id and ativo = true
    and (id = new.servico_id or lower(trim(nome_servico)) = lower(trim(new.servico)))
  order by (id = new.servico_id) desc limit 1;
  if not found then raise exception 'O serviço selecionado não está disponível'; end if;

  new.nome_cliente := trim(new.nome_cliente);
  new.telefone_cliente := trim(new.telefone_cliente);
  new.observacoes := nullif(trim(new.observacoes), '');
  new.servico_id := v_servico.id;
  new.servico := v_servico.nome_servico;
  new.duracao_minutos := v_servico.duracao_minutos;
  new.cliente_usuario_id := coalesce(new.cliente_usuario_id, auth.uid());

  if char_length(new.nome_cliente) not between 3 and 120 then raise exception 'Informe um nome válido'; end if;
  if char_length(regexp_replace(new.telefone_cliente, '\\D', '', 'g')) not between 10 and 13 then raise exception 'Informe um telefone válido com DDD'; end if;
  if char_length(coalesce(new.observacoes,'')) > 1000 then raise exception 'As observações podem ter no máximo 1000 caracteres'; end if;

  v_data_local := new.data_agendamento at time zone 'America/Bahia';
  if new.data_agendamento < now() + make_interval(mins => v_empresa.agendamento_antecedencia_minutos) then
    raise exception 'Este horário não respeita a antecedência mínima';
  end if;
  if new.data_agendamento > now() + make_interval(days => v_empresa.agendamento_max_dias) then
    raise exception 'Este horário está além do período permitido para reservas';
  end if;
  if not (extract(isodow from v_data_local)::smallint = any(v_empresa.agendamento_dias_semana)) then
    raise exception 'A empresa não atende neste dia da semana';
  end if;
  if v_data_local::time < v_empresa.agendamento_hora_inicio
     or (v_data_local + make_interval(mins => v_servico.duracao_minutos))::time > v_empresa.agendamento_hora_fim then
    raise exception 'O serviço não cabe no horário de atendimento';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.empresa_id::text || v_data_local::date::text, 0));
  v_data_fim := new.data_agendamento + make_interval(mins => v_servico.duracao_minutos);
  if exists (
    select 1 from public.agendamentos a
    where a.empresa_id = new.empresa_id and a.status in ('pendente','confirmado')
      and a.id <> coalesce(new.id, gen_random_uuid())
      and tstzrange(a.data_agendamento, a.data_agendamento + make_interval(mins => a.duracao_minutos), '[)')
          && tstzrange(new.data_agendamento, v_data_fim, '[)')
  ) then raise exception 'Este horário acabou de ser reservado. Escolha outro horário'; end if;

  return new;
end;
$$;

drop trigger if exists trigger_validar_agendamento on public.agendamentos;
create trigger trigger_validar_agendamento
before insert or update of empresa_id, servico_id, servico, data_agendamento
on public.agendamentos for each row execute function public.validar_agendamento_antes_insert();

create or replace function public.listar_horarios_agendamento(
  p_empresa_id uuid,
  p_servico text,
  p_data date
)
returns table (horario timestamptz)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_empresa public.empresas%rowtype;
  v_duracao integer;
  v_inicio timestamp;
  v_fim timestamp;
begin
  select * into v_empresa from public.empresas
  where id = p_empresa_id and ativo = true and status_aprovacao = 'aprovado' and agendamentos_ativo = true;
  if not found or not (extract(isodow from p_data)::smallint = any(v_empresa.agendamento_dias_semana)) then return; end if;

  select duracao_minutos into v_duracao from public.servicos_agendamento
  where empresa_id = p_empresa_id and ativo = true and lower(trim(nome_servico)) = lower(trim(p_servico)) limit 1;
  if v_duracao is null then return; end if;

  v_inicio := p_data + v_empresa.agendamento_hora_inicio;
  v_fim := p_data + v_empresa.agendamento_hora_fim;

  return query
  select (slot at time zone 'America/Bahia') as horario
  from generate_series(v_inicio, v_fim - make_interval(mins => v_duracao), make_interval(mins => v_empresa.agendamento_intervalo_minutos)) slot
  where (slot at time zone 'America/Bahia') >= now() + make_interval(mins => v_empresa.agendamento_antecedencia_minutos)
    and (slot at time zone 'America/Bahia') <= now() + make_interval(days => v_empresa.agendamento_max_dias)
    and not exists (
      select 1 from public.agendamentos a
      where a.empresa_id = p_empresa_id and a.status in ('pendente','confirmado')
        and tstzrange(a.data_agendamento, a.data_agendamento + make_interval(mins => a.duracao_minutos), '[)')
            && tstzrange(slot at time zone 'America/Bahia', (slot + make_interval(mins => v_duracao)) at time zone 'America/Bahia', '[)')
    )
  order by slot;
end;
$$;

create or replace function public.criar_agendamento_publico(
  p_empresa_id uuid,
  p_nome_cliente text,
  p_telefone_cliente text,
  p_servico text,
  p_data_agendamento timestamptz,
  p_observacoes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_id uuid;
begin
  insert into public.agendamentos (empresa_id,nome_cliente,telefone_cliente,servico,data_agendamento,observacoes,status,cliente_usuario_id)
  values (p_empresa_id,p_nome_cliente,p_telefone_cliente,p_servico,p_data_agendamento,p_observacoes,'pendente',auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.listar_horarios_agendamento(uuid,text,date) from public;
revoke all on function public.criar_agendamento_publico(uuid,text,text,text,timestamptz,text) from public;
grant execute on function public.listar_horarios_agendamento(uuid,text,date) to anon, authenticated;
grant execute on function public.criar_agendamento_publico(uuid,text,text,text,timestamptz,text) to anon, authenticated;

revoke all on function public.validar_agendamento_antes_insert() from public, anon, authenticated;
revoke insert on table public.agendamentos from anon, authenticated;
drop policy if exists "Anyone can create appointments for active business" on public.agendamentos;
drop policy if exists "Usuários autenticados podem criar agendamentos" on public.agendamentos;
