-- Curadoria explícita para impedir que oficinas e outros negócios sem relação
-- apareçam como mobilidade apenas por coincidência de palavras.

create table public.viver_saj_empresas (
  modulo text not null references public.viver_saj_modulos(chave) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  ordem smallint not null default 1 check (ordem between 1 and 500),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primary key (modulo, empresa_id)
);

create index viver_saj_empresas_publico_idx
  on public.viver_saj_empresas (modulo, ativo, ordem);

create trigger viver_saj_empresas_updated_at before update on public.viver_saj_empresas
  for each row execute function public.update_updated_at_column();

alter table public.viver_saj_empresas enable row level security;
revoke all on table public.viver_saj_empresas from anon, authenticated;
grant select on table public.viver_saj_empresas to anon, authenticated;
grant insert, update, delete on table public.viver_saj_empresas to authenticated;

create policy "Publico le empresas ativas do Viver SAJ"
  on public.viver_saj_empresas for select
  to anon, authenticated
  using (ativo = true);

create policy "Admins gerenciam empresas do Viver SAJ"
  on public.viver_saj_empresas for all
  to authenticated
  using (private.admin_mfa_verified(null, false))
  with check (private.admin_mfa_verified(null, false));

-- A categoria passa a existir no cadastro normal de empresas. Novos negócios
-- classificados nela entram automaticamente na área de mobilidade.
insert into public.categorias (nome, slug, tipo, ativo)
select 'Mobilidade Urbana', 'mobilidade-urbana', 'empresa', true
where not exists (
  select 1 from public.categorias where slug = 'mobilidade-urbana'
);
