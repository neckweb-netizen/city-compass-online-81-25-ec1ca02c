create table if not exists public.tool_view_counts (
  tool_slug text primary key,
  view_count bigint not null default 0 check (view_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.tool_view_counts enable row level security;

drop policy if exists "Tool popularity is publicly readable" on public.tool_view_counts;
create policy "Tool popularity is publicly readable"
on public.tool_view_counts
for select
to anon, authenticated
using (true);

revoke all on table public.tool_view_counts from anon, authenticated;
grant select on table public.tool_view_counts to anon, authenticated;

create or replace function public.increment_tool_view(p_tool_slug text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_view_count bigint;
begin
  if p_tool_slug is null or p_tool_slug not in (
    'gerador-rifa',
    'gerador-cobranca',
    'criador-curriculo',
    'gestao-cobrancas',
    'calculadora-orcamento',
    'calculadora-margem',
    'simulador-rescisao',
    'leitor-voz',
    'consulta-fipe'
  ) then
    return null;
  end if;

  insert into public.tool_view_counts (tool_slug, view_count, updated_at)
  values (p_tool_slug, 1, now())
  on conflict (tool_slug) do update
  set view_count = public.tool_view_counts.view_count + 1,
      updated_at = now()
  returning view_count into next_view_count;

  return next_view_count;
end;
$$;

revoke all on function public.increment_tool_view(text) from public;
grant execute on function public.increment_tool_view(text) to anon, authenticated;

insert into public.tool_view_counts (tool_slug)
values
  ('gerador-rifa'),
  ('gerador-cobranca'),
  ('criador-curriculo'),
  ('gestao-cobrancas'),
  ('calculadora-orcamento'),
  ('calculadora-margem'),
  ('simulador-rescisao'),
  ('leitor-voz'),
  ('consulta-fipe')
on conflict (tool_slug) do nothing;
