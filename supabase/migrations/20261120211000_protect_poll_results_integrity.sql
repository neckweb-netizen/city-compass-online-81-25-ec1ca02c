-- Once voting starts, preserve the answer mapping and vote type.
-- Other administrative fields, including active period and title, remain editable.
create or replace function private.guard_poll_options_after_votes()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if (new.opcoes is distinct from old.opcoes
      or new.multipla_escolha is distinct from old.multipla_escolha)
    and exists (select 1 from public.respostas_enquete r where r.enquete_id = old.id)
  then
    raise exception 'As opções e o tipo de votação não podem mudar após o primeiro voto'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_poll_options_after_votes on public.enquetes;
create trigger guard_poll_options_after_votes
  before update of opcoes, multipla_escolha on public.enquetes
  for each row execute function private.guard_poll_options_after_votes();
