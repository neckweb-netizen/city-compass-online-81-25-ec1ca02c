alter table public.eventos
  add column if not exists link_ingressos text,
  add column if not exists preco_descricao text,
  add column if not exists recorrencia text not null default 'nenhuma',
  add column if not exists publico_alvo text,
  add column if not exists acessibilidade text,
  add column if not exists checkin_ativo boolean not null default false,
  add column if not exists avaliacoes_ativas boolean not null default true,
  add column if not exists visualizacoes bigint not null default 0,
  add column if not exists compartilhamentos bigint not null default 0;

alter table public.eventos
  drop constraint if exists eventos_recorrencia_valida,
  add constraint eventos_recorrencia_valida
    check (recorrencia in ('nenhuma', 'semanal', 'quinzenal', 'mensal')),
  drop constraint if exists eventos_preco_valido,
  add constraint eventos_preco_valido check (preco is null or preco >= 0);

create table if not exists public.evento_avaliacoes (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  nota smallint not null check (nota between 1 and 5),
  comentario text check (comentario is null or char_length(comentario) <= 1000),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (evento_id, usuario_id)
);

create table if not exists public.evento_checkins (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  inscricao_id uuid not null references public.evento_inscricoes(id) on delete cascade,
  realizado_por uuid not null references auth.users(id),
  realizado_em timestamptz not null default now(),
  unique (inscricao_id)
);

create index if not exists evento_avaliacoes_evento_idx on public.evento_avaliacoes(evento_id);
create index if not exists evento_checkins_evento_idx on public.evento_checkins(evento_id);
create index if not exists eventos_filtros_publicos_idx
  on public.eventos(cidade_id, data_inicio, categoria_id)
  where ativo and status_aprovacao = 'aprovado';

alter table public.evento_avaliacoes enable row level security;
alter table public.evento_checkins enable row level security;

revoke all on public.evento_avaliacoes from anon, authenticated;
grant select (id, evento_id, nota, comentario, criado_em, atualizado_em)
  on public.evento_avaliacoes to anon, authenticated;
grant insert (evento_id, usuario_id, nota, comentario, atualizado_em)
  on public.evento_avaliacoes to authenticated;
grant update (nota, comentario, atualizado_em)
  on public.evento_avaliacoes to authenticated;
grant delete on public.evento_avaliacoes to authenticated;
grant select, insert, delete on public.evento_checkins to authenticated;

drop policy if exists "Avaliacoes publicas de eventos" on public.evento_avaliacoes;
create policy "Avaliacoes publicas de eventos" on public.evento_avaliacoes
for select to anon, authenticated using (
  exists (
    select 1 from public.eventos e
    where e.id = evento_id and e.ativo and e.status_aprovacao = 'aprovado'
  )
);

drop policy if exists "Usuario avalia evento uma vez" on public.evento_avaliacoes;
create policy "Usuario avalia evento uma vez" on public.evento_avaliacoes
for insert to authenticated with check (
  (select auth.uid()) = usuario_id
  and exists (
    select 1 from public.eventos e
    where e.id = evento_id and e.avaliacoes_ativas and e.data_inicio <= now()
  )
);

drop policy if exists "Usuario altera propria avaliacao" on public.evento_avaliacoes;
create policy "Usuario altera propria avaliacao" on public.evento_avaliacoes
for update to authenticated
using ((select auth.uid()) = usuario_id)
with check ((select auth.uid()) = usuario_id);

drop policy if exists "Usuario remove propria avaliacao" on public.evento_avaliacoes;
create policy "Usuario remove propria avaliacao" on public.evento_avaliacoes
for delete to authenticated using ((select auth.uid()) = usuario_id);

drop policy if exists "Organizador consulta checkins" on public.evento_checkins;
create policy "Organizador consulta checkins" on public.evento_checkins
for select to authenticated using (
  exists (
    select 1 from public.eventos e
    join public.empresas emp on emp.id = e.empresa_id
    where e.id = evento_id
      and (emp.usuario_id = (select auth.uid()) or public.is_admin((select auth.uid())))
  )
);

drop policy if exists "Organizador realiza checkin" on public.evento_checkins;
create policy "Organizador realiza checkin" on public.evento_checkins
for insert to authenticated with check (
  realizado_por = (select auth.uid())
  and exists (
    select 1 from public.eventos e
    join public.empresas emp on emp.id = e.empresa_id
    where e.id = evento_id and e.checkin_ativo
      and (emp.usuario_id = (select auth.uid()) or public.is_admin((select auth.uid())))
  )
);

drop policy if exists "Organizador desfaz checkin" on public.evento_checkins;
create policy "Organizador desfaz checkin" on public.evento_checkins
for delete to authenticated using (
  exists (
    select 1 from public.eventos e
    join public.empresas emp on emp.id = e.empresa_id
    where e.id = evento_id
      and (emp.usuario_id = (select auth.uid()) or public.is_admin((select auth.uid())))
  )
);
