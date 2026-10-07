-- Cardápio digital público com edição protegida pelo proprietário.
alter type public.tipo_secao_banner add value if not exists 'cardapio_digital';

create table public.cardapios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  nome text not null check (char_length(nome) between 2 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 3 and 80),
  descricao text check (descricao is null or char_length(descricao) <= 600),
  logo_url text,
  capa_url text,
  whatsapp text check (whatsapp is null or char_length(whatsapp) <= 24),
  endereco text check (endereco is null or char_length(endereco) <= 300),
  instagram text check (instagram is null or char_length(instagram) <= 100),
  cor_primaria text not null default '#7c3aed' check (cor_primaria ~ '^#[0-9a-fA-F]{6}$'),
  aceita_pedidos boolean not null default true,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.cardapio_itens (
  id uuid primary key default gen_random_uuid(),
  cardapio_id uuid not null references public.cardapios(id) on delete cascade,
  categoria text not null default 'Geral' check (char_length(categoria) between 1 and 60),
  nome text not null check (char_length(nome) between 2 and 120),
  descricao text check (descricao is null or char_length(descricao) <= 500),
  preco numeric(10,2) not null check (preco >= 0 and preco <= 999999.99),
  imagem_url text,
  disponivel boolean not null default true,
  destaque boolean not null default false,
  ordem smallint not null default 1 check (ordem between 1 and 999),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index cardapios_publicos_idx on public.cardapios (slug) where ativo = true;
create index cardapio_itens_publicos_idx on public.cardapio_itens (cardapio_id, categoria, ordem) where disponivel = true;
create index cardapio_itens_cardapio_id_idx on public.cardapio_itens (cardapio_id);

create trigger cardapios_updated_at before update on public.cardapios
  for each row execute function public.update_updated_at_column();
create trigger cardapio_itens_updated_at before update on public.cardapio_itens
  for each row execute function public.update_updated_at_column();

alter table public.cardapios enable row level security;
alter table public.cardapio_itens enable row level security;

revoke all on table public.cardapios, public.cardapio_itens from anon, authenticated;
grant select on table public.cardapios, public.cardapio_itens to anon, authenticated;
grant insert, update, delete on table public.cardapios, public.cardapio_itens to authenticated;

create policy "Cardápios publicados são públicos"
  on public.cardapios for select to anon, authenticated
  using (ativo = true);

create policy "Usuários leem o próprio cardápio"
  on public.cardapios for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Usuários criam o próprio cardápio"
  on public.cardapios for insert to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Usuários atualizam o próprio cardápio"
  on public.cardapios for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Usuários excluem o próprio cardápio"
  on public.cardapios for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Admins gerenciam cardápios"
  on public.cardapios for all to authenticated
  using (private.admin_mfa_verified(null, false))
  with check (private.admin_mfa_verified(null, false));

create policy "Itens de cardápios publicados são públicos"
  on public.cardapio_itens for select to anon, authenticated
  using (
    disponivel = true and exists (
      select 1 from public.cardapios
      where cardapios.id = cardapio_itens.cardapio_id and cardapios.ativo = true
    )
  );

create policy "Proprietários leem todos os itens"
  on public.cardapio_itens for select to authenticated
  using (
    exists (
      select 1 from public.cardapios
      where cardapios.id = cardapio_itens.cardapio_id
        and cardapios.user_id = (select auth.uid())
    )
  );

create policy "Proprietários criam itens"
  on public.cardapio_itens for insert to authenticated
  with check (
    exists (
      select 1 from public.cardapios
      where cardapios.id = cardapio_itens.cardapio_id
        and cardapios.user_id = (select auth.uid())
    )
  );

create policy "Proprietários atualizam itens"
  on public.cardapio_itens for update to authenticated
  using (
    exists (
      select 1 from public.cardapios
      where cardapios.id = cardapio_itens.cardapio_id
        and cardapios.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.cardapios
      where cardapios.id = cardapio_itens.cardapio_id
        and cardapios.user_id = (select auth.uid())
    )
  );

create policy "Proprietários excluem itens"
  on public.cardapio_itens for delete to authenticated
  using (
    exists (
      select 1 from public.cardapios
      where cardapios.id = cardapio_itens.cardapio_id
        and cardapios.user_id = (select auth.uid())
    )
  );

create policy "Admins gerenciam itens de cardápio"
  on public.cardapio_itens for all to authenticated
  using (private.admin_mfa_verified(null, false))
  with check (private.admin_mfa_verified(null, false));
