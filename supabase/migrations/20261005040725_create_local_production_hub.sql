alter table public.configuracoes_sistema
  add column if not exists producao_local_ativa boolean not null default true;

create table public.produtores_locais (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  empresa_id uuid references public.empresas(id) on delete set null,
  nome_publico text not null check (char_length(nome_publico) between 3 and 100),
  tipo text not null default 'produtor_individual'
    check (tipo in ('produtor_individual', 'agricultura_familiar', 'associacao', 'cooperativa')),
  descricao text check (descricao is null or char_length(descricao) <= 700),
  comunidade text check (comunidade is null or char_length(comunidade) <= 100),
  municipio text not null default 'Santo Antônio de Jesus',
  telefone_whatsapp text check (telefone_whatsapp is null or telefone_whatsapp ~ '^[0-9]{10,15}$'),
  produtos text[] not null default '{}'::text[] check (cardinality(produtos) between 1 and 30),
  certificacoes text[] not null default '{}'::text[] check (cardinality(certificacoes) <= 20),
  entrega boolean not null default false,
  varejo boolean not null default true,
  atacado boolean not null default false,
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'rejeitado')),
  ativo boolean not null default false,
  consentimento_publicacao boolean not null default false,
  revisado_por uuid references auth.users(id) on delete set null,
  revisado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint produtores_locais_usuario_unique unique (usuario_id),
  constraint produtor_aprovado_ativo_check check (not ativo or status = 'aprovado')
);

create index produtores_locais_publicos_idx
  on public.produtores_locais (status, ativo, nome_publico);
create index produtores_locais_produtos_gin_idx
  on public.produtores_locais using gin (produtos);

create trigger produtores_locais_updated_at
  before update on public.produtores_locais
  for each row execute function public.update_updated_at_column();

alter table public.produtores_locais enable row level security;
revoke all on table public.produtores_locais from anon, authenticated;
grant select on table public.produtores_locais to anon, authenticated;
grant insert, update, delete on table public.produtores_locais to authenticated;

create policy "Visitantes leem produtores aprovados"
  on public.produtores_locais for select
  to anon, authenticated
  using (status = 'aprovado' and ativo = true and consentimento_publicacao = true);

create policy "Usuario le o proprio cadastro rural"
  on public.produtores_locais for select
  to authenticated
  using ((select auth.uid()) = usuario_id);

create policy "Usuario cria o proprio cadastro rural pendente"
  on public.produtores_locais for insert
  to authenticated
  with check (
    (select auth.uid()) = usuario_id
    and status = 'pendente'
    and ativo = false
    and consentimento_publicacao = true
    and revisado_por is null
    and revisado_em is null
  );

create policy "Usuario atualiza o proprio cadastro rural para nova analise"
  on public.produtores_locais for update
  to authenticated
  using ((select auth.uid()) = usuario_id)
  with check (
    (select auth.uid()) = usuario_id
    and status = 'pendente'
    and ativo = false
    and consentimento_publicacao = true
    and revisado_por is null
    and revisado_em is null
  );

create policy "Usuario exclui o proprio cadastro rural"
  on public.produtores_locais for delete
  to authenticated
  using ((select auth.uid()) = usuario_id);

create policy "Administradores moderam produtores locais"
  on public.produtores_locais for all
  to authenticated
  using (private.admin_mfa_verified(null, false))
  with check (private.admin_mfa_verified(null, false));

insert into public.menu_configuracoes
  (nome_item, rota, icone, posicao_desktop, posicao_mobile, ordem, apenas_admin, ativo)
select 'Produção Local', '/producao-local', 'Sprout', 'sidebar', 'hamburger', 6, false, true
where not exists (
  select 1 from public.menu_configuracoes where rota = '/producao-local'
);
