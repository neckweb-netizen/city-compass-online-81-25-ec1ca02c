-- Atualiza medicamento e horários em uma única transação, sem comprometer histórico de doses.
-- Executa com permissões do usuário e RLS das tabelas originais.
create or replace function public.save_medicine_with_schedule(p_medicine jsonb, p_schedules jsonb)
returns void language plpgsql security invoker set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_med_id uuid;
  v_item jsonb;
  v_ids uuid[];
  v_id uuid;
  v_days smallint[];
  v_time time;
begin
  if v_uid is null then raise exception 'Autenticação necessária' using errcode='28000'; end if;
  if p_medicine is null or jsonb_typeof(p_medicine) <> 'object'
     or p_schedules is null or jsonb_typeof(p_schedules) <> 'array'
     or jsonb_array_length(p_schedules) < 1 or jsonb_array_length(p_schedules) > 24
     or octet_length(p_medicine::text) > 16000
     or octet_length(p_schedules::text) > 16000 then
    raise exception 'Medicamento ou horários inválidos' using errcode='22023';
  end if;
  v_med_id := (p_medicine->>'id')::uuid;
  if v_med_id is null or length(btrim(coalesce(p_medicine->>'nome',''))) not between 1 and 120
     or (p_medicine->>'dataInicio') is null then
    raise exception 'Identificação ou nome do medicamento inválido' using errcode='22023';
  end if;
  if exists(select 1 from public.medicamentos_usuario where id=v_med_id and user_id<>v_uid)
    then raise exception 'Medicamento não pertence à conta' using errcode='42501'; end if;
  insert into public.medicamentos_usuario (
    id,user_id,nome,dose,instrucoes,data_inicio,data_fim,ativo,estoque_atual,estoque_minimo
  ) values (
    v_med_id,v_uid,btrim(p_medicine->>'nome'),
    nullif(p_medicine->>'dose',''),nullif(p_medicine->>'instrucoes',''),
    (p_medicine->>'dataInicio')::date,nullif(p_medicine->>'dataFim','')::date,
    coalesce((p_medicine->>'ativo')::boolean,true),
    nullif(p_medicine->>'estoqueAtual','')::numeric,
    nullif(p_medicine->>'estoqueMinimo','')::numeric
  )
  on conflict (id) do update set
    nome=excluded.nome,dose=excluded.dose,instrucoes=excluded.instrucoes,
    data_inicio=excluded.data_inicio,data_fim=excluded.data_fim,
    ativo=excluded.ativo,estoque_atual=excluded.estoque_atual,
    estoque_minimo=excluded.estoque_minimo,atualizado_em=now()
  where medicamentos_usuario.user_id=v_uid;
  if not found then raise exception 'Não foi possível alterar o medicamento' using errcode='42501'; end if;

  v_ids := array[]::uuid[];
  for v_item in select value from jsonb_array_elements(p_schedules)
  loop
    v_id := (v_item->>'id')::uuid;
    v_time := (v_item->>'hora')::time;
    select array_agg(value::smallint) into v_days
      from jsonb_array_elements_text(v_item->'diasSemana');
    if v_id is null or v_time is null or v_days is null
       or cardinality(v_days)<1
       or not(v_days <@ array[0,1,2,3,4,5,6]::smallint[])
       or v_id=any(v_ids)
       or nullif(v_item->>'medicamentoId','')::uuid is distinct from v_med_id then
      raise exception 'Horários repetidos ou inválidos' using errcode='22023';
    end if;
    v_ids := array_append(v_ids,v_id);
    insert into public.medicamento_horarios (
      id,user_id,medicamento_id,hora,dias_semana,notificar
    ) values (
      v_id,v_uid,v_med_id,v_time,v_days,coalesce((v_item->>'notificar')::boolean,true)
    )
    on conflict (id) do update set
      hora=excluded.hora,dias_semana=excluded.dias_semana,
      notificar=excluded.notificar,atualizado_em=now()
    where medicamento_horarios.user_id=v_uid
      and medicamento_horarios.medicamento_id=v_med_id;
    if not found then raise exception 'Horário não pertence à conta' using errcode='42501'; end if;
  end loop;
  delete from public.medicamento_horarios
    where user_id=v_uid and medicamento_id=v_med_id and not(id=any(v_ids));
end;
$$;
revoke all on function public.save_medicine_with_schedule(jsonb,jsonb) from public, anon;
grant execute on function public.save_medicine_with_schedule(jsonb,jsonb) to authenticated;
