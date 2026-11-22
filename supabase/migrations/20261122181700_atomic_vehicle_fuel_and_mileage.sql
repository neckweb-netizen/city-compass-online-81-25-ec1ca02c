create or replace function public.save_vehicle_fuel_atomic(p_fuel jsonb)
returns void language plpgsql security invoker set search_path = ''
as $$
declare
 uid uuid := (select auth.uid());
 vid uuid;
 fid uuid;
 km numeric;
 liters numeric;
 total numeric;
 entry_date date;
 affected integer;
begin
 if uid is null then raise exception 'Autenticação necessária' using errcode='28000'; end if;
 if p_fuel is null or jsonb_typeof(p_fuel) <> 'object' then raise exception 'Dados inválidos' using errcode='22023'; end if;
 fid := (p_fuel->>'id')::uuid;
 vid := (p_fuel->>'veiculoId')::uuid;
 km := (p_fuel->>'quilometragem')::numeric;
 liters := (p_fuel->>'litros')::numeric;
 total := (p_fuel->>'valorTotal')::numeric;
 entry_date := (p_fuel->>'data')::date;
 if fid is null or vid is null or entry_date is null or km is null or km < 0
   or liters is null or liters <= 0 or total is null or total <= 0 then
   raise exception 'Abastecimento incompleto' using errcode='22023';
 end if;
 perform 1 from public.veiculos_usuario where id=vid and user_id=uid for update;
 if not found then raise exception 'Veículo não encontrado' using errcode='42501'; end if;
 insert into public.veiculo_abastecimentos
 (id,user_id,veiculo_id,data_abastecimento,quilometragem,litros,valor_total,combustivel,posto,tanque_completo,observacao)
 values
 (fid,uid,vid,entry_date,km,liters,total,
 nullif(btrim(p_fuel->>'combustivel'),''),
 nullif(btrim(p_fuel->>'posto'),''),
 coalesce((p_fuel->>'tanqueCompleto')::boolean,true),
 nullif(btrim(p_fuel->>'observacao'),''))
 on conflict (id) do update set
 data_abastecimento=excluded.data_abastecimento,quilometragem=excluded.quilometragem,
 litros=excluded.litros,valor_total=excluded.valor_total,combustivel=excluded.combustivel,
 posto=excluded.posto,tanque_completo=excluded.tanque_completo,observacao=excluded.observacao
 where veiculo_abastecimentos.user_id=uid and veiculo_abastecimentos.veiculo_id=vid;
 get diagnostics affected=row_count;
 if affected <> 1 then raise exception 'Registro não pertence à conta' using errcode='42501'; end if;
 update public.veiculos_usuario
 set quilometragem_atual=greatest(quilometragem_atual,km), atualizado_em=now()
 where id=vid and user_id=uid;
 get diagnostics affected=row_count;
 if affected <> 1 then raise exception 'Veículo não atualizado' using errcode='42501'; end if;
end
$$;
revoke all on function public.save_vehicle_fuel_atomic(jsonb) from public,anon;
grant execute on function public.save_vehicle_fuel_atomic(jsonb) to authenticated;