-- Retain the moderation decision when a report is dismissed.
alter table public.denuncias_avaliacoes
  add column if not exists status text not null default 'pendente',
  add column if not exists analisado_em timestamptz;
alter table public.denuncias_avaliacoes
  add constraint denuncias_avaliacoes_status_check
  check (status in ('pendente','descartada'));

create policy "Administradores MFA podem descartar denúncias"
on public.denuncias_avaliacoes for update to authenticated
using (exists (
  select 1 from public.avaliacoes a
  join public.empresas e on e.id = a.empresa_id
  where a.id = denuncias_avaliacoes.avaliacao_id
    and private.admin_mfa_verified(e.cidade_id, false)
))
with check (exists (
  select 1 from public.avaliacoes a
  join public.empresas e on e.id = a.empresa_id
  where a.id = denuncias_avaliacoes.avaliacao_id
    and private.admin_mfa_verified(e.cidade_id, false)
));

create or replace function private.guard_review_report_status()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if current_user <> 'authenticated' then return new; end if;
  if (to_jsonb(new) - 'status' - 'analisado_em') is distinct from
     (to_jsonb(old) - 'status' - 'analisado_em') then
    raise exception 'Somente o estado da denúncia pode ser alterado'
      using errcode='42501';
  end if;
  if old.status = 'descartada' and new.status <> old.status then
    raise exception 'Denúncia já analisada' using errcode='23514';
  end if;
  if new.status = 'descartada' then new.analisado_em := coalesce(old.analisado_em, now()); end if;
  return new;
end;
$$;
drop trigger if exists guard_review_report_status on public.denuncias_avaliacoes;
create trigger guard_review_report_status before update on public.denuncias_avaliacoes
for each row execute function private.guard_review_report_status();
grant update (status, analisado_em) on public.denuncias_avaliacoes to authenticated;
