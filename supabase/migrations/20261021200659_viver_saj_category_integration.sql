-- Integra os módulos do Viver SAJ às categorias normais do catálogo.
-- O conteúdo continua vindo de empresas aprovadas; o admin apenas escolhe
-- quais categorias alimentam cada módulo e pode fazer exceções manuais.

create table public.viver_saj_categorias (
  modulo text not null references public.viver_saj_modulos(chave) on delete cascade,
  categoria_id uuid not null references public.categorias(id) on delete cascade,
  ordem smallint not null default 1 check (ordem between 1 and 500),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primary key (modulo, categoria_id)
);

create index viver_saj_categorias_publico_idx
  on public.viver_saj_categorias (modulo, ativo, ordem);

create trigger viver_saj_categorias_updated_at before update on public.viver_saj_categorias
  for each row execute function public.update_updated_at_column();

alter table public.viver_saj_categorias enable row level security;
revoke all on table public.viver_saj_categorias from anon, authenticated;
grant select on table public.viver_saj_categorias to anon, authenticated;
grant insert, update, delete on table public.viver_saj_categorias to authenticated;

create policy "Publico le categorias ativas do Viver SAJ"
  on public.viver_saj_categorias for select
  to anon, authenticated
  using (ativo = true);

create policy "Admins gerenciam categorias do Viver SAJ"
  on public.viver_saj_categorias for all
  to authenticated
  using (private.admin_mfa_verified(null, false))
  with check (private.admin_mfa_verified(null, false));

-- Saúde e Mobilidade já começam sincronizadas com as categorias existentes.
insert into public.viver_saj_categorias (modulo, categoria_id, ordem)
select 'saude', id, row_number() over (order by nome)::smallint
from public.categorias
where slug in ('saude', 'saude-e-bem-estar')
on conflict do nothing;

insert into public.viver_saj_categorias (modulo, categoria_id, ordem)
select 'mobilidade', id, row_number() over (order by nome)::smallint
from public.categorias
where slug in ('mobilidade-urbana', 'moto-txi-', 'moto-taxi')
   or lower(nome) like '%moto-t%xi%'
on conflict do nothing;
