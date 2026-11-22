-- Recuperação opt-in do armazenamento legado. Não apaga nem sobrescreve registros existentes.
-- Uma transação abrange os 4 conjuntos e respeita a RLS do usuário autenticado.
create or replace function public.import_legacy_vehicle_backup(p_backup jsonb)
returns jsonb language plpgsql security invoker set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_kind text;
  v_count integer;
  v_id_count integer;
begin
  if v_uid is null then raise exception 'Login necessário para importar backup' using errcode='28000'; end if;
  if p_backup is null or jsonb_typeof(p_backup) <> 'object' or octet_length(p_backup::text) > 1048576
    then raise exception 'Backup de veículos inválido ou grande demais' using errcode='22023'; end if;
  foreach v_kind in array array['veiculos','abastecimentos','manutencoes','lembretes']
  loop
    if jsonb_typeof(p_backup->v_kind) <> 'array' then
      raise exception 'Lista inválida no backup: %',v_kind using errcode='22023'; end if;
    v_count := jsonb_array_length(p_backup->v_kind);
    if v_count > 500 then raise exception 'Máximo de 500 registros por categoria' using errcode='22023'; end if;
    select count(distinct item->>'id') into v_id_count
    from jsonb_array_elements(p_backup->v_kind) item;
    if v_id_count <> v_count then raise exception 'IDs repetidos ou ausentes em %',v_kind using errcode='22023'; end if;
  end loop;

  insert into public.veiculos_usuario
    (id,user_id,apelido,marca,modelo,ano,placa,combustivel,quilometragem_atual,ativo)
  select id,v_uid,nullif(apelido,''),nullif(marca,''),modelo,ano,
    nullif(placa,''),nullif(combustivel,''),coalesce("quilometragemAtual",0),coalesce(ativo,true)
  from jsonb_to_recordset(p_backup->'veiculos') as x(
    id uuid,apelido text,marca text,modelo text,ano integer,placa text,combustivel text,
    "quilometragemAtual" numeric,ativo boolean)
  on conflict (id) do nothing;
  if exists(
    select 1 from jsonb_array_elements(p_backup->'veiculos') obj
    left join public.veiculos_usuario v
      on v.id=(obj->>'id')::uuid and v.user_id=v_uid
    where v.id is null
  ) then raise exception 'Backup contém veículo de outra conta ou ID inválido' using errcode='42501'; end if;

  insert into public.veiculo_abastecimentos
    (id,user_id,veiculo_id,data_abastecimento,quilometragem,litros,valor_total,
      combustivel,posto,tanque_completo,observacao)
  select id,v_uid,"veiculoId",data,quilometragem,litros,"valorTotal",
    nullif(combustivel,''),nullif(posto,''),coalesce("tanqueCompleto",true),nullif(observacao,'')
  from jsonb_to_recordset(p_backup->'abastecimentos') as x(
    id uuid,"veiculoId" uuid,data date,quilometragem numeric,litros numeric,
    "valorTotal" numeric,combustivel text,posto text,"tanqueCompleto" boolean,observacao text)
  on conflict (id) do nothing;
  if exists(
    select 1 from jsonb_array_elements(p_backup->'abastecimentos') obj
    left join public.veiculo_abastecimentos a
      on a.id=(obj->>'id')::uuid and a.user_id=v_uid
        and a.veiculo_id=(obj->>'veiculoId')::uuid
    where a.id is null
  ) then raise exception 'Abastecimento conflitante no backup' using errcode='42501'; end if;

  insert into public.veiculo_manutencoes
    (id,user_id,veiculo_id,data_manutencao,tipo,quilometragem,valor,oficina,observacao)
  select id,v_uid,"veiculoId",data,tipo,quilometragem,coalesce(valor,0),
    nullif(oficina,''),nullif(observacao,'')
  from jsonb_to_recordset(p_backup->'manutencoes') as x(
    id uuid,"veiculoId" uuid,data date,tipo text,quilometragem numeric,valor numeric,
    oficina text,observacao text)
  on conflict (id) do nothing;
  if exists(
    select 1 from jsonb_array_elements(p_backup->'manutencoes') obj
    left join public.veiculo_manutencoes m
      on m.id=(obj->>'id')::uuid and m.user_id=v_uid
        and m.veiculo_id=(obj->>'veiculoId')::uuid
    where m.id is null
  ) then raise exception 'Manutenção conflitante no backup' using errcode='42501'; end if;

  insert into public.veiculo_lembretes
    (id,user_id,veiculo_id,titulo,tipo,data_vencimento,quilometragem_alvo,
      lembrar_dias_antes,lembrar_hora,notificar,concluido)
  select id,v_uid,"veiculoId",titulo,coalesce(tipo,'manutencao'),
    nullif("dataVencimento",'')::date,"quilometragemAlvo",
    coalesce("lembrarDiasAntes",7),coalesce(nullif("lembrarHora",''),'09:00')::time,
    coalesce(notificar,false),coalesce(concluido,false)
  from jsonb_to_recordset(p_backup->'lembretes') as x(
    id uuid,"veiculoId" uuid,titulo text,tipo text,"dataVencimento" text,
    "quilometragemAlvo" numeric,"lembrarDiasAntes" integer,
    "lembrarHora" text,notificar boolean,concluido boolean)
  on conflict (id) do nothing;
  if exists(
    select 1 from jsonb_array_elements(p_backup->'lembretes') obj
    left join public.veiculo_lembretes l
      on l.id=(obj->>'id')::uuid and l.user_id=v_uid
        and l.veiculo_id=(obj->>'veiculoId')::uuid
    where l.id is null
  ) then raise exception 'Lembrete conflitante no backup' using errcode='42501'; end if;

  return jsonb_build_object('success',true,
    'veiculos',jsonb_array_length(p_backup->'veiculos'),
    'abastecimentos',jsonb_array_length(p_backup->'abastecimentos'),
    'manutencoes',jsonb_array_length(p_backup->'manutencoes'),
    'lembretes',jsonb_array_length(p_backup->'lembretes'));
end;
$$;
revoke all on function public.import_legacy_vehicle_backup(jsonb) from public,anon;
grant execute on function public.import_legacy_vehicle_backup(jsonb) to authenticated;
