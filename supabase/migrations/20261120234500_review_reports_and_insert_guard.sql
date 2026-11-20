-- Review creation cannot impersonate a business reply or manipulate timestamps.
create or replace function private.guard_review_insert()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if current_user <> 'authenticated' then return new; end if;
  if private.admin_mfa_verified((select cidade_id from public.empresas where id = new.empresa_id), false) then
    return new;
  end if;
  if new.usuario_id is distinct from (select auth.uid())
    or new.resposta_empresa is not null or new.respondido_em is not null
    or new.criado_em is distinct from now() and new.criado_em < now() - interval '5 minutes'
  then
    raise exception 'A autoria e a resposta não podem ser definidas no cadastro'
      using errcode = '42501';
  end if;
  if exists (select 1 from public.empresas e where e.id = new.empresa_id and e.usuario_id = (select auth.uid())) then
    raise exception 'Não é permitido avaliar a própria empresa' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_review_insert on public.avaliacoes;
create trigger guard_review_insert before insert on public.avaliacoes
for each row execute function private.guard_review_insert();

create table if not exists public.denuncias_avaliacoes (
  id uuid primary key default gen_random_uuid(),
  avaliacao_id uuid not null references public.avaliacoes(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  motivo text not null check (char_length(btrim(motivo)) between 5 and 500),
  criado_em timestamptz not null default now(),
  unique (avaliacao_id, usuario_id)
);
create index if not exists denuncias_avaliacoes_criado_idx on public.denuncias_avaliacoes(criado_em desc);
alter table public.denuncias_avaliacoes enable row level security;
create policy "Usuário pode denunciar avaliação" on public.denuncias_avaliacoes
for insert to authenticated with check (
  usuario_id = (select auth.uid())
  and exists(select 1 from public.avaliacoes a where a.id = avaliacao_id and a.usuario_id <> (select auth.uid()))
);
create policy "Denunciante pode ver sua denúncia" on public.denuncias_avaliacoes
for select to authenticated using (usuario_id = (select auth.uid()));
create policy "Administradores com MFA podem ver denúncias" on public.denuncias_avaliacoes
for select to authenticated using (exists (
  select 1 from public.avaliacoes a
  join public.empresas e on e.id = a.empresa_id
  where a.id = denuncias_avaliacoes.avaliacao_id
    and private.admin_mfa_verified(e.cidade_id, false)
));
grant select, insert on public.denuncias_avaliacoes to authenticated;
