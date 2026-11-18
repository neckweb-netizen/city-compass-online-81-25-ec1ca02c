-- Already applied in Supabase production as migration 20261118120600.
-- Reject mismatched domino tile faces and missing board endpoints.
-- Retains existing ownership and timing checks.
CREATE OR REPLACE FUNCTION private.guard_domino_sala_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  v_old_len integer := coalesce(jsonb_array_length(old.historico_jogadas), 0);
  v_new_len integer := coalesce(jsonb_array_length(new.historico_jogadas), 0);
  v_added jsonb;
  v_left boolean := false;
  v_a integer;
  v_b integer;
  v_original text;
begin
  if current_user in ('postgres', 'service_role') then return new; end if;
  if v_uid is null or v_uid not in (old.jogador_1_id, old.jogador_2_id) then
    raise exception 'Jogador não pertence a esta partida' using errcode = '42501';
  end if;
  if new.jogador_1_id is distinct from old.jogador_1_id
     or new.jogador_2_id is distinct from old.jogador_2_id
     or new.numero_sala is distinct from old.numero_sala
     or new.status is distinct from old.status
     or new.resultado_registrado is distinct from old.resultado_registrado
     or new.resultado_tipo is distinct from old.resultado_tipo
     or new.vencedor_id is distinct from old.vencedor_id then
    raise exception 'Use a operação segura do servidor para alterar a sala' using errcode = '42501';
  end if;
  if new.historico_jogadas is not distinct from old.historico_jogadas then
    raise exception 'Atualização de partida inválida' using errcode = '42501';
  end if;
  if old.status <> 'jogando' or old.vez_usuario_id is distinct from v_uid or v_new_len <> v_old_len + 1 then
    raise exception 'Jogada fora da vez ou histórico inválido' using errcode = '42501';
  end if;

  if v_old_len = 0 then
    v_added := new.historico_jogadas -> 0;
  elsif (new.historico_jogadas - 0) = old.historico_jogadas then
    v_left := true;
    v_added := new.historico_jogadas -> 0;
  elsif (new.historico_jogadas - (v_new_len - 1)) = old.historico_jogadas then
    v_added := new.historico_jogadas -> (v_new_len - 1);
  else
    raise exception 'O histórico existente não pode ser reescrito' using errcode = '42501';
  end if;

  v_a := (v_added ->> 'ladoEsquerdo')::integer;
  v_b := (v_added ->> 'ladoDireito')::integer;
  v_original := v_added ->> 'valorOriginal';
  if v_a not between 0 and 6 or v_b not between 0 and 6
     or v_original !~ '^[0-6]-[0-6]$' then
    raise exception 'Peça de dominó inválida' using errcode = '22023';
  end if;

  if v_a is null or v_b is null
     or new.mesa_ponta_esquerda is null or new.mesa_ponta_direita is null
     or least(v_a,v_b) is distinct from
        least(split_part(v_original,'-',1)::integer,split_part(v_original,'-',2)::integer)
     or greatest(v_a,v_b) is distinct from
        greatest(split_part(v_original,'-',1)::integer,split_part(v_original,'-',2)::integer)
  then
    raise exception 'Os valores da peça não correspondem à jogada informada'
      using errcode='22023';
  end if;

  if exists (
    select 1 from jsonb_array_elements(old.historico_jogadas) item
    where least(split_part(item->>'valorOriginal','-',1)::integer, split_part(item->>'valorOriginal','-',2)::integer)
            = least(split_part(v_original,'-',1)::integer, split_part(v_original,'-',2)::integer)
      and greatest(split_part(item->>'valorOriginal','-',1)::integer, split_part(item->>'valorOriginal','-',2)::integer)
            = greatest(split_part(v_original,'-',1)::integer, split_part(v_original,'-',2)::integer)
  ) then
    raise exception 'Esta peça já foi jogada' using errcode = '23505';
  end if;
  if v_old_len > 0 and (
    (v_left and (v_b <> old.mesa_ponta_esquerda or new.mesa_ponta_esquerda <> v_a or new.mesa_ponta_direita <> old.mesa_ponta_direita))
    or (not v_left and (v_a <> old.mesa_ponta_direita or new.mesa_ponta_direita <> v_b or new.mesa_ponta_esquerda <> old.mesa_ponta_esquerda))
  ) then
    raise exception 'A peça não encaixa na ponta escolhida' using errcode = '22023';
  end if;

  new.vez_usuario_id := case when v_uid = old.jogador_1_id then old.jogador_2_id else old.jogador_1_id end;
  new.passadas_count := 0;
  new.ultima_jogada_usuario_id := v_uid;
  new.jogadas_jogador_1 := old.jogadas_jogador_1 + case when v_uid = old.jogador_1_id then 1 else 0 end;
  new.jogadas_jogador_2 := old.jogadas_jogador_2 + case when v_uid = old.jogador_2_id then 1 else 0 end;
  new.atualizado_em := now();
  return new;
exception when invalid_text_representation or null_value_not_allowed then
  raise exception 'Formato da peça inválido' using errcode = '22023';
end;
$function$

