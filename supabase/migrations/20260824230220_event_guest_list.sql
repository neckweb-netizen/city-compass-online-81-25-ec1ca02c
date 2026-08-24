alter table public.eventos
  add column if not exists lista_participantes_ativa boolean not null default false,
  add column if not exists lista_exibir_nomes boolean not null default false,
  add column if not exists fila_espera_ativa boolean not null default true,
  add column if not exists permitir_acompanhantes boolean not null default false,
  add column if not exists limite_acompanhantes integer not null default 0,
  add column if not exists inscricoes_encerram_em timestamptz;

alter table public.eventos
  drop constraint if exists eventos_limite_participantes_valido,
  add constraint eventos_limite_participantes_valido
    check (limite_participantes is null or limite_participantes > 0),
  drop constraint if exists eventos_limite_acompanhantes_valido,
  add constraint eventos_limite_acompanhantes_valido
    check (limite_acompanhantes between 0 and 20);

create table if not exists public.evento_inscricoes (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  nome text not null check (char_length(trim(nome)) between 2 and 100),
  acompanhantes integer not null default 0 check (acompanhantes between 0 and 20),
  status text not null default 'confirmado' check (status in ('confirmado', 'espera')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (evento_id, usuario_id)
);

create index if not exists evento_inscricoes_evento_status_idx
  on public.evento_inscricoes (evento_id, status, criado_em);

alter table public.evento_inscricoes enable row level security;

revoke all on table public.evento_inscricoes from anon, authenticated;
grant select, insert, delete on table public.evento_inscricoes to authenticated;
grant select on table public.evento_inscricoes to anon;

drop policy if exists "Participantes consultam inscricoes permitidas" on public.evento_inscricoes;
create policy "Participantes consultam inscricoes permitidas"
on public.evento_inscricoes for select to anon, authenticated
using (
  usuario_id = (select auth.uid())
  or exists (
    select 1 from public.eventos e
    where e.id = evento_id
      and e.lista_participantes_ativa
      and e.lista_exibir_nomes
      and public.evento_inscricoes.status = 'confirmado'
  )
  or exists (
    select 1 from public.eventos e
    join public.empresas emp on emp.id = e.empresa_id
    where e.id = evento_id
      and (emp.usuario_id = (select auth.uid()) or public.is_admin((select auth.uid())))
  )
);

drop policy if exists "Usuarios criam a propria inscricao" on public.evento_inscricoes;
create policy "Usuarios criam a propria inscricao"
on public.evento_inscricoes for insert to authenticated
with check (usuario_id = (select auth.uid()));

drop policy if exists "Usuarios cancelam inscricoes permitidas" on public.evento_inscricoes;
create policy "Usuarios cancelam inscricoes permitidas"
on public.evento_inscricoes for delete to authenticated
using (
  usuario_id = (select auth.uid())
  or exists (
    select 1 from public.eventos e
    join public.empresas emp on emp.id = e.empresa_id
    where e.id = evento_id
      and (emp.usuario_id = (select auth.uid()) or public.is_admin((select auth.uid())))
  )
);

create or replace function private.preparar_inscricao_evento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  evento public.eventos%rowtype;
  ocupadas integer;
  solicitadas integer := 1 + new.acompanhantes;
begin
  if (select auth.uid()) is null or new.usuario_id <> (select auth.uid()) then
    raise exception 'A inscrição deve pertencer ao usuário autenticado' using errcode = '42501';
  end if;

  select * into evento from public.eventos where id = new.evento_id for update;
  if not found or not evento.ativo or evento.status_aprovacao::text <> 'aprovado' then
    raise exception 'Evento indisponível para inscrições' using errcode = 'P0001';
  end if;
  if not evento.lista_participantes_ativa then
    raise exception 'Este evento não possui lista de participantes' using errcode = 'P0001';
  end if;
  if now() > coalesce(evento.inscricoes_encerram_em, evento.data_inicio) then
    raise exception 'As inscrições deste evento foram encerradas' using errcode = 'P0001';
  end if;
  if not evento.permitir_acompanhantes and new.acompanhantes > 0 then
    raise exception 'Este evento não permite acompanhantes' using errcode = 'P0001';
  end if;
  if new.acompanhantes > evento.limite_acompanhantes then
    raise exception 'Limite de acompanhantes excedido' using errcode = 'P0001';
  end if;

  select coalesce(sum(1 + i.acompanhantes), 0)::integer into ocupadas
  from public.evento_inscricoes i
  where i.evento_id = new.evento_id and i.status = 'confirmado';

  if evento.limite_participantes is null or ocupadas + solicitadas <= evento.limite_participantes then
    new.status := 'confirmado';
  elsif evento.fila_espera_ativa then
    new.status := 'espera';
  else
    raise exception 'A lista deste evento está lotada' using errcode = 'P0001';
  end if;

  new.nome := trim(new.nome);
  new.atualizado_em := now();
  return new;
end;
$$;

revoke all on function private.preparar_inscricao_evento() from public, anon, authenticated;
drop trigger if exists preparar_inscricao_evento_trigger on public.evento_inscricoes;
create trigger preparar_inscricao_evento_trigger
before insert on public.evento_inscricoes
for each row execute function private.preparar_inscricao_evento();

create or replace function private.sincronizar_lista_evento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  alvo uuid;
  capacidade integer;
  ocupadas integer;
  candidato public.evento_inscricoes%rowtype;
begin
  if tg_op = 'DELETE' then
    alvo := old.evento_id;
  else
    alvo := new.evento_id;
  end if;

  if pg_trigger_depth() > 1 then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;

  select limite_participantes into capacidade
  from public.eventos where id = alvo for update;

  select coalesce(sum(1 + acompanhantes), 0)::integer into ocupadas
  from public.evento_inscricoes where evento_id = alvo and status = 'confirmado';

  if capacidade is not null then
    for candidato in
      select * from public.evento_inscricoes
      where evento_id = alvo and status = 'espera'
      order by criado_em
    loop
      exit when ocupadas + 1 + candidato.acompanhantes > capacidade;
      update public.evento_inscricoes set status = 'confirmado', atualizado_em = now()
      where id = candidato.id;
      ocupadas := ocupadas + 1 + candidato.acompanhantes;
    end loop;
  end if;

  update public.eventos set participantes_confirmados = ocupadas where id = alvo;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

revoke all on function private.sincronizar_lista_evento() from public, anon, authenticated;
drop trigger if exists sincronizar_lista_evento_trigger on public.evento_inscricoes;
create trigger sincronizar_lista_evento_trigger
after insert or update or delete on public.evento_inscricoes
for each row execute function private.sincronizar_lista_evento();
