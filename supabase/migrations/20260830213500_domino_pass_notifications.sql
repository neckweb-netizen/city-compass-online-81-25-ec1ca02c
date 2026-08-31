alter table public.domino_salas
  add column if not exists ultimo_passe_usuario_id uuid references public.usuarios(id) on delete set null,
  add column if not exists ultimo_passe_em timestamptz,
  add column if not exists ultimo_passe_motivo text;

alter table public.domino_salas
  drop constraint if exists domino_salas_ultimo_passe_motivo_check;

alter table public.domino_salas
  add constraint domino_salas_ultimo_passe_motivo_check
  check (ultimo_passe_motivo is null or ultimo_passe_motivo in ('sem_peca', 'tempo'));

drop function if exists public.passar_vez_domino(uuid);

create or replace function public.passar_vez_domino(
  p_sala_id uuid,
  p_motivo text default 'sem_peca'
)
returns table (
  proxima_vez_usuario_id uuid,
  nova_contagem_passadas integer,
  jogo_trancado boolean,
  passe_em timestamptz
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
  v_passe_em timestamptz := clock_timestamp();
begin
  if v_usuario_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  if p_motivo not in ('sem_peca', 'tempo') then
    raise exception 'Motivo do passe inválido';
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
      ultimo_passe_usuario_id = v_usuario_id,
      ultimo_passe_em = v_passe_em,
      ultimo_passe_motivo = p_motivo,
      atualizado_em = v_passe_em
  where id = p_sala_id;

  return query select
    case when v_passadas >= 2 then null::uuid else v_proximo_id end,
    v_passadas,
    v_passadas >= 2,
    v_passe_em;
end;
$$;

revoke all on function public.passar_vez_domino(uuid, text) from public;
revoke all on function public.passar_vez_domino(uuid, text) from anon;
grant execute on function public.passar_vez_domino(uuid, text) to authenticated;

