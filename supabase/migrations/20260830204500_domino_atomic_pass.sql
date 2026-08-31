-- Troca a vez de forma atômica e impede que outra pessoa passe pelo jogador atual.
create or replace function public.passar_vez_domino(p_sala_id uuid)
returns table (
  proxima_vez_usuario_id uuid,
  nova_contagem_passadas integer,
  jogo_trancado boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sala public.domino_salas%rowtype;
  v_usuario_id uuid := auth.uid();
  v_proximo_id uuid;
  v_passadas integer;
begin
  if v_usuario_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  select * into v_sala
  from public.domino_salas
  where id = p_sala_id
  for update;

  if not found then
    raise exception 'Sala não encontrada';
  end if;

  if v_usuario_id is distinct from v_sala.vez_usuario_id then
    raise exception 'Não é a vez deste jogador';
  end if;

  if v_usuario_id is distinct from v_sala.jogador_1_id
     and v_usuario_id is distinct from v_sala.jogador_2_id then
    raise exception 'Jogador não pertence a esta sala';
  end if;

  v_proximo_id := case
    when v_usuario_id = v_sala.jogador_1_id then v_sala.jogador_2_id
    else v_sala.jogador_1_id
  end;
  v_passadas := coalesce(v_sala.passadas_count, 0) + 1;

  update public.domino_salas
  set vez_usuario_id = case when v_passadas >= 2 then null else v_proximo_id end,
      passadas_count = v_passadas,
      atualizado_em = now()
  where id = p_sala_id;

  return query select
    case when v_passadas >= 2 then null::uuid else v_proximo_id end,
    v_passadas,
    v_passadas >= 2;
end;
$$;

revoke all on function public.passar_vez_domino(uuid) from public;
revoke all on function public.passar_vez_domino(uuid) from anon;
grant execute on function public.passar_vez_domino(uuid) to authenticated;

