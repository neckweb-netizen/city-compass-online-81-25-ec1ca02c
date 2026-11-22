-- Uma restauração financeira ocorre em uma única transação PostgreSQL.
-- Sem SECURITY DEFINER: as políticas RLS da conta continuam aplicáveis.
create or replace function public.restore_finance_account_data(p_transactions jsonb, p_settings jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_count integer;
  v_row record;
  v_affected integer;
begin
  if v_uid is null then
    raise exception 'É necessário estar autenticado' using errcode = '28000';
  end if;
  if p_transactions is null or jsonb_typeof(p_transactions) <> 'array'
    or p_settings is null or jsonb_typeof(p_settings) <> 'object' then
    raise exception 'Formato de backup inválido' using errcode = '22023';
  end if;
  v_count := jsonb_array_length(p_transactions);
  if v_count > 2000 then
    raise exception 'Máximo de 2000 lançamentos por restauração' using errcode = '22023';
  end if;
  if (select count(distinct item->>'id') from jsonb_array_elements(p_transactions) item) <> v_count then
    raise exception 'O backup contém IDs duplicados ou ausentes' using errcode = '22023';
  end if;
  if jsonb_typeof(p_settings->'monthlyBudget') <> 'number'
    or jsonb_typeof(p_settings->'savingsGoal') <> 'number'
    or jsonb_typeof(p_settings->'emergencyFundGoal') <> 'number' then
    raise exception 'Metas financeiras inválidas' using errcode = '22023';
  end if;
  for v_row in
    select * from jsonb_to_recordset(p_transactions)
      as x(id uuid, type text, title text, amount numeric, category text,
           date date, status text, recurring boolean, note text,
           notify boolean, "reminderDaysBefore" integer, "reminderTime" time,
           "createdAt" timestamptz)
  loop
    if v_row.id is null or v_row.type is null or v_row.title is null
      or v_row.amount is null or v_row.category is null or v_row.date is null
      or v_row.status is null or v_row.recurring is null or v_row."createdAt" is null then
      raise exception 'Lançamento incompleto' using errcode = '22023';
    end if;
    insert into public.finance_lancamentos (
      id, user_id, tipo, titulo, valor, categoria, data_lancamento, status,
      recorrente, observacao, notificar, lembrete_dias_antes, lembrete_hora, criado_em
    ) values (
      v_row.id, v_uid, v_row.type, v_row.title, v_row.amount, v_row.category,
      v_row.date, v_row.status, v_row.recurring, v_row.note,
      coalesce(v_row.notify, false), coalesce(v_row."reminderDaysBefore", 1),
      coalesce(v_row."reminderTime", '09:00'::time), v_row."createdAt"
    ) on conflict (id) do update set
      tipo = excluded.tipo, titulo = excluded.titulo, valor = excluded.valor,
      categoria = excluded.categoria, data_lancamento = excluded.data_lancamento,
      status = excluded.status, recorrente = excluded.recorrente,
      observacao = excluded.observacao, notificar = excluded.notificar,
      lembrete_dias_antes = excluded.lembrete_dias_antes,
      lembrete_hora = excluded.lembrete_hora, atualizado_em = now()
    where finance_lancamentos.user_id = v_uid;
    get diagnostics v_affected = row_count;
    if v_affected <> 1 then
      raise exception 'Há um lançamento inacessível no backup' using errcode = '42501';
    end if;
  end loop;

  insert into public.finance_configuracoes (
    user_id, orcamento_mensal, meta_economia, meta_reserva_emergencia
  ) values (
    v_uid, (p_settings->>'monthlyBudget')::numeric,
    (p_settings->>'savingsGoal')::numeric,
    (p_settings->>'emergencyFundGoal')::numeric
  ) on conflict (user_id) do update set
    orcamento_mensal = excluded.orcamento_mensal,
    meta_economia = excluded.meta_economia,
    meta_reserva_emergencia = excluded.meta_reserva_emergencia,
    atualizado_em = now();

  delete from public.finance_lancamentos
   where user_id = v_uid
     and not exists (
       select 1 from jsonb_array_elements(p_transactions) item
       where (item->>'id')::uuid = finance_lancamentos.id
     );
end;
$$;
revoke all on function public.restore_finance_account_data(jsonb,jsonb) from public, anon;
grant execute on function public.restore_finance_account_data(jsonb,jsonb) to authenticated;
