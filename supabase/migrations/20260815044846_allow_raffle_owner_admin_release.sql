create or replace function private.atualizar_numero_rifa(
  p_rifa_id uuid,
  p_numero text,
  p_status text,
  p_nome text default null,
  p_telefone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_numeros jsonb;
  v_novos_numeros jsonb;
  v_item jsonb;
  v_user_id uuid;
  v_status_atual text;
  v_numero text := btrim(coalesce(p_numero, ''));
  v_nome text := btrim(coalesce(p_nome, ''));
  v_telefone text := btrim(coalesce(p_telefone, ''));
  v_eh_dono boolean := false;
  v_eh_admin boolean := false;
begin
  if p_status not in ('livre', 'reservado', 'pago') then
    raise exception using errcode = '22023', message = 'Status da reserva invalido.';
  end if;

  if v_numero = '' or char_length(v_numero) > 10 then
    raise exception using errcode = '22023', message = 'Numero da rifa invalido.';
  end if;

  select r.numeros, r.user_id
    into v_numeros, v_user_id
  from public.rifas_usuarios r
  where r.id = p_rifa_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Rifa nao encontrada ou encerrada.';
  end if;

  if jsonb_typeof(v_numeros) <> 'array' then
    raise exception using errcode = '22023', message = 'Cartela da rifa invalida.';
  end if;

  select item
    into v_item
  from jsonb_array_elements(v_numeros) item
  where item ->> 'numero' = v_numero
  limit 1;

  if v_item is null then
    raise exception using errcode = 'P0002', message = 'Numero nao encontrado nesta rifa.';
  end if;

  v_status_atual := coalesce(v_item ->> 'status', 'livre');
  v_eh_dono := v_user_id is not null
    and coalesce(v_user_id = (select auth.uid()), false);

  if (select auth.uid()) is not null then
    select exists (
      select 1
      from public.usuarios u
      where u.id = (select auth.uid())
        and u.tipo_conta::text in ('admin_geral', 'admin_cidade')
    ) into v_eh_admin;
  end if;

  -- Somente o criador e administradores podem devolver um numero ocupado
  -- para a cartela. Administradores continuam sendo tratados como visitantes
  -- nas demais transicoes; apenas o criador pode marcar pagamentos.
  if p_status = 'livre' then
    if not (v_eh_dono or v_eh_admin) then
      raise exception using errcode = '42501', message = 'Somente o criador da rifa ou um administrador pode liberar este numero.';
    end if;
    if v_status_atual = 'livre' then
      raise exception using errcode = '22023', message = 'Este numero ja esta livre.';
    end if;
  elsif not v_eh_dono then
    if p_status <> 'reservado' then
      raise exception using errcode = '42501', message = 'Somente o criador da rifa pode alterar esta reserva.';
    end if;
    if v_status_atual <> 'livre' then
      raise exception using errcode = '23505', message = 'Este numero acabou de ser reservado por outra pessoa.';
    end if;
  end if;

  if p_status <> 'livre' then
    if char_length(v_nome) < 2 or char_length(v_nome) > 120 then
      raise exception using errcode = '22023', message = 'Informe o nome do comprador.';
    end if;
    if char_length(v_telefone) < 8 or char_length(v_telefone) > 30 then
      raise exception using errcode = '22023', message = 'Informe um telefone valido.';
    end if;
  end if;

  select jsonb_agg(
    case
      when item ->> 'numero' = v_numero then
        case
          when p_status = 'livre' then
            jsonb_build_object('numero', v_numero, 'status', 'livre')
          else
            jsonb_build_object(
              'numero', v_numero,
              'status', p_status,
              'nome', v_nome,
              'telefone', v_telefone
            )
        end
      else item
    end
    order by ordinality
  )
    into v_novos_numeros
  from jsonb_array_elements(v_numeros) with ordinality as itens(item, ordinality);

  update public.rifas_usuarios
  set numeros = v_novos_numeros
  where id = p_rifa_id;

  return v_novos_numeros;
end;
$$;

revoke all on function private.atualizar_numero_rifa(uuid, text, text, text, text)
  from public, anon, authenticated;
grant execute on function private.atualizar_numero_rifa(uuid, text, text, text, text)
  to anon, authenticated, service_role;

notify pgrst, 'reload schema';
