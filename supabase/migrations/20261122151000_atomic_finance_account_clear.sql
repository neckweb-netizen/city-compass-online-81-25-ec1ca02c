-- Exclusão transacional dos dados financeiros da conta autenticada.
-- SECURITY INVOKER mantém as políticas RLS de ambas as tabelas.
create or replace function public.clear_finance_account_data()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sessão autenticada necessária para apagar dados financeiros'
      using errcode = '28000';
  end if;
  delete from public.finance_lancamentos where user_id = (select auth.uid());
  delete from public.finance_configuracoes where user_id = (select auth.uid());
end;
$$;
revoke all on function public.clear_finance_account_data() from public, anon;
grant execute on function public.clear_finance_account_data() to authenticated;
