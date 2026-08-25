-- Comunidade anonima "Entre Nos" com moderacao previa e privacidade por coluna.
create table public.entre_nos_postagens (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  categoria text not null check (categoria in ('desabafo','relacionamentos','familia','trabalho','saude_emocional','conselhos','gratidao','superacao')),
  sexo text not null check (sexo in ('masculino','feminino','nao_binario')),
  idade smallint not null check (idade between 13 and 100),
  faixa_etaria text generated always as (
    case when idade < 18 then '13–17' when idade < 25 then '18–24'
         when idade < 35 then '25–34' when idade < 45 then '35–44'
         when idade < 60 then '45–59' else '60+' end
  ) stored,
  conteudo text not null check (char_length(btrim(conteudo)) between 20 and 3000),
  permitir_comentarios boolean not null default true,
  conteudo_sensivel boolean not null default false,
  status text not null default 'pendente' check (status in ('pendente','aprovado','rejeitado','oculto')),
  destaque boolean not null default false,
  motivo_moderacao text,
  moderado_por uuid references auth.users(id) on delete set null,
  moderado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.entre_nos_comentarios (
  id uuid primary key default gen_random_uuid(),
  postagem_id uuid not null references public.entre_nos_postagens(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  conteudo text not null check (char_length(btrim(conteudo)) between 2 and 1000),
  status text not null default 'pendente' check (status in ('pendente','aprovado','rejeitado','oculto')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.entre_nos_reacoes (
  id uuid primary key default gen_random_uuid(),
  postagem_id uuid not null references public.entre_nos_postagens(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('apoio','forca','identificacao')),
  criado_em timestamptz not null default now(),
  unique (postagem_id, usuario_id)
);

create table public.entre_nos_denuncias (
  id uuid primary key default gen_random_uuid(),
  postagem_id uuid references public.entre_nos_postagens(id) on delete cascade,
  comentario_id uuid references public.entre_nos_comentarios(id) on delete cascade,
  denunciante_id uuid not null references auth.users(id) on delete cascade,
  motivo text not null check (motivo in ('assedio','odio','violencia','automutilacao','sexual','spam','outro')),
  detalhes text check (detalhes is null or char_length(detalhes) <= 500),
  status text not null default 'aberta' check (status in ('aberta','resolvida','descartada')),
  revisado_por uuid references auth.users(id) on delete set null,
  revisado_em timestamptz,
  criado_em timestamptz not null default now(),
  check ((postagem_id is not null)::int + (comentario_id is not null)::int = 1)
);

create index entre_nos_postagens_feed_idx on public.entre_nos_postagens (status, destaque desc, criado_em desc);
create index entre_nos_comentarios_post_idx on public.entre_nos_comentarios (postagem_id, status, criado_em);
create index entre_nos_reacoes_post_idx on public.entre_nos_reacoes (postagem_id, tipo);
create index entre_nos_denuncias_status_idx on public.entre_nos_denuncias (status, criado_em desc);

alter table public.entre_nos_postagens enable row level security;
alter table public.entre_nos_comentarios enable row level security;
alter table public.entre_nos_reacoes enable row level security;
alter table public.entre_nos_denuncias enable row level security;

create policy "Feed aprovado e proprio" on public.entre_nos_postagens for select
using (status = 'aprovado' or usuario_id = (select auth.uid()) or public.is_admin((select auth.uid())));
create policy "Criar postagem propria" on public.entre_nos_postagens for insert to authenticated
with check (usuario_id = (select auth.uid()) and status = 'pendente' and destaque = false);
create policy "Autor remove postagem" on public.entre_nos_postagens for delete to authenticated
using (usuario_id = (select auth.uid()) or public.is_admin((select auth.uid())));
create policy "Admin modera postagem" on public.entre_nos_postagens for update to authenticated
using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));

create policy "Comentarios aprovados e proprios" on public.entre_nos_comentarios for select
using (status = 'aprovado' or usuario_id = (select auth.uid()) or public.is_admin((select auth.uid())));
create policy "Criar comentario proprio" on public.entre_nos_comentarios for insert to authenticated
with check (usuario_id = (select auth.uid()) and status = 'pendente' and exists (
  select 1 from public.entre_nos_postagens p where p.id = postagem_id and p.status = 'aprovado' and p.permitir_comentarios
));
create policy "Autor remove comentario" on public.entre_nos_comentarios for delete to authenticated
using (usuario_id = (select auth.uid()) or public.is_admin((select auth.uid())));
create policy "Admin modera comentario" on public.entre_nos_comentarios for update to authenticated
using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));

create policy "Reacoes visiveis" on public.entre_nos_reacoes for select using (true);
create policy "Reagir como usuario" on public.entre_nos_reacoes for insert to authenticated
with check (usuario_id = (select auth.uid()));
create policy "Alterar propria reacao" on public.entre_nos_reacoes for update to authenticated
using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
create policy "Remover propria reacao" on public.entre_nos_reacoes for delete to authenticated
using (usuario_id = (select auth.uid()));

create policy "Criar denuncia propria" on public.entre_nos_denuncias for insert to authenticated
with check (denunciante_id = (select auth.uid()) and status = 'aberta');
create policy "Admin ve denuncias" on public.entre_nos_denuncias for select to authenticated
using (public.is_admin((select auth.uid())));
create policy "Admin revisa denuncias" on public.entre_nos_denuncias for update to authenticated
using (public.is_admin((select auth.uid()))) with check (public.is_admin((select auth.uid())));

-- Evita expor identidade, idade exata e notas internas pela API.
revoke all on public.entre_nos_postagens, public.entre_nos_comentarios, public.entre_nos_reacoes, public.entre_nos_denuncias from anon, authenticated;
grant select (id,categoria,sexo,faixa_etaria,conteudo,permitir_comentarios,conteudo_sensivel,status,destaque,criado_em,atualizado_em)
  on public.entre_nos_postagens to anon, authenticated;
grant insert (usuario_id,categoria,sexo,idade,conteudo,permitir_comentarios,conteudo_sensivel)
  on public.entre_nos_postagens to authenticated;
grant update (status,destaque,permitir_comentarios,conteudo_sensivel,motivo_moderacao,moderado_por,moderado_em)
  on public.entre_nos_postagens to authenticated;
grant delete on public.entre_nos_postagens to authenticated;

grant select (id,postagem_id,conteudo,status,criado_em,atualizado_em) on public.entre_nos_comentarios to anon, authenticated;
grant insert (postagem_id,usuario_id,conteudo) on public.entre_nos_comentarios to authenticated;
grant update (status) on public.entre_nos_comentarios to authenticated;
grant delete on public.entre_nos_comentarios to authenticated;

grant select (id,postagem_id,tipo,criado_em) on public.entre_nos_reacoes to anon, authenticated;
grant insert (postagem_id,usuario_id,tipo) on public.entre_nos_reacoes to authenticated;
grant update (tipo) on public.entre_nos_reacoes to authenticated;
grant delete on public.entre_nos_reacoes to authenticated;

grant insert (postagem_id,comentario_id,denunciante_id,motivo,detalhes) on public.entre_nos_denuncias to authenticated;
grant select (id,postagem_id,comentario_id,motivo,detalhes,status,revisado_em,criado_em) on public.entre_nos_denuncias to authenticated;
grant update (status,revisado_por,revisado_em) on public.entre_nos_denuncias to authenticated;

-- Limites contra abuso, executados internamente e sem RPC publica.
create schema if not exists private;
create or replace function private.limitar_entre_nos() returns trigger language plpgsql security definer
set search_path = pg_catalog, public as $$
declare total integer;
begin
  if tg_table_name = 'entre_nos_postagens' then
    select count(*) into total from public.entre_nos_postagens where usuario_id = new.usuario_id and criado_em >= date_trunc('day', now());
    if total >= 3 then raise exception 'Limite diario de publicacoes atingido'; end if;
  elsif tg_table_name = 'entre_nos_comentarios' then
    select count(*) into total from public.entre_nos_comentarios where usuario_id = new.usuario_id and criado_em >= date_trunc('day', now());
    if total >= 20 then raise exception 'Limite diario de comentarios atingido'; end if;
  end if;
  return new;
end; $$;
revoke all on function private.limitar_entre_nos() from public, anon, authenticated;
create trigger limitar_postagens_entre_nos before insert on public.entre_nos_postagens for each row execute function private.limitar_entre_nos();
create trigger limitar_comentarios_entre_nos before insert on public.entre_nos_comentarios for each row execute function private.limitar_entre_nos();
