alter table public.domino_estatisticas
  add column if not exists empates integer not null default 0,
  add column if not exists pontuacao integer not null default 0;

alter table public.domino_estatisticas
  drop constraint if exists domino_estatisticas_pontuacao_check;
alter table public.domino_estatisticas
  add constraint domino_estatisticas_pontuacao_check check (pontuacao >= 0);

alter table public.domino_salas
  add column if not exists resultado_registrado boolean not null default false,
  add column if not exists vencedor_id uuid references public.usuarios(id) on delete set null,
  add column if not exists resultado_tipo text;

alter table public.domino_salas
  drop constraint if exists domino_salas_resultado_tipo_check;
alter table public.domino_salas
  add constraint domino_salas_resultado_tipo_check
  check (resultado_tipo is null or resultado_tipo in ('vitoria', 'empate'));

create or replace function public.preparar_nova_partida_domino()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.jogador_1_id is not null
     and new.jogador_2_id is not null
     and new.status = 'jogando'
     and (old.jogador_1_id is null or old.jogador_2_id is null or old.status <> 'jogando') then
    new.resultado_registrado := false;
    new.vencedor_id := null;
    new.resultado_tipo := null;
  end if;
  return new;
end;
$$;

drop trigger if exists preparar_nova_partida_domino_trigger on public.domino_salas;
create trigger preparar_nova_partida_domino_trigger
before update on public.domino_salas
for each row execute function public.preparar_nova_partida_domino();

revoke all on function public.preparar_nova_partida_domino() from public, anon, authenticated;

create or replace function public.finalizar_partida_domino(
  p_sala_id uuid,
  p_resultado text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sala public.domino_salas%rowtype;
  v_usuario_id uuid := auth.uid();
  v_perdedor_id uuid;
begin
  if v_usuario_id is null then
    raise exception 'Usuário não autenticado';
  end if;
  if p_resultado not in ('vitoria', 'empate') then
    raise exception 'Resultado inválido';
  end if;

  select * into v_sala
  from public.domino_salas
  where id = p_sala_id
  for update;

  if not found or v_sala.jogador_1_id is null or v_sala.jogador_2_id is null then
    raise exception 'Partida não encontrada ou incompleta';
  end if;
  if v_usuario_id <> v_sala.jogador_1_id and v_usuario_id <> v_sala.jogador_2_id then
    raise exception 'Jogador não pertence a esta partida';
  end if;
  if v_sala.resultado_registrado then
    return false;
  end if;

  if p_resultado = 'empate' then
    insert into public.domino_estatisticas
      (usuario_id, vitorias, empates, derrotas, partidas_jogadas, pontuacao, atualizado_em)
    values
      (v_sala.jogador_1_id, 0, 1, 0, 1, 1, now()),
      (v_sala.jogador_2_id, 0, 1, 0, 1, 1, now())
    on conflict (usuario_id) do update set
      empates = public.domino_estatisticas.empates + 1,
      partidas_jogadas = public.domino_estatisticas.partidas_jogadas + 1,
      pontuacao = public.domino_estatisticas.pontuacao + 1,
      atualizado_em = now();

    update public.domino_salas
    set resultado_registrado = true,
        resultado_tipo = 'empate',
        vencedor_id = null,
        status = 'finalizada',
        atualizado_em = now()
    where id = p_sala_id;
  else
    v_perdedor_id := case
      when v_usuario_id = v_sala.jogador_1_id then v_sala.jogador_2_id
      else v_sala.jogador_1_id
    end;

    insert into public.domino_estatisticas
      (usuario_id, vitorias, empates, derrotas, partidas_jogadas, pontuacao, atualizado_em)
    values (v_usuario_id, 1, 0, 0, 1, 3, now())
    on conflict (usuario_id) do update set
      vitorias = public.domino_estatisticas.vitorias + 1,
      partidas_jogadas = public.domino_estatisticas.partidas_jogadas + 1,
      pontuacao = public.domino_estatisticas.pontuacao + 3,
      atualizado_em = now();

    insert into public.domino_estatisticas
      (usuario_id, vitorias, empates, derrotas, partidas_jogadas, pontuacao, atualizado_em)
    values (v_perdedor_id, 0, 0, 1, 1, 0, now())
    on conflict (usuario_id) do update set
      derrotas = public.domino_estatisticas.derrotas + 1,
      partidas_jogadas = public.domino_estatisticas.partidas_jogadas + 1,
      pontuacao = greatest(0, public.domino_estatisticas.pontuacao - 2),
      atualizado_em = now();

    update public.domino_salas
    set resultado_registrado = true,
        resultado_tipo = 'vitoria',
        vencedor_id = v_usuario_id,
        status = 'finalizada',
        atualizado_em = now()
    where id = p_sala_id;
  end if;

  return true;
end;
$$;

revoke all on function public.finalizar_partida_domino(uuid, text) from public;
revoke all on function public.finalizar_partida_domino(uuid, text) from anon;
grant execute on function public.finalizar_partida_domino(uuid, text) to authenticated;

create or replace function public.registrar_empate_domino_ao_trancar()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.passadas_count >= 2
     and coalesce(old.passadas_count, 0) < 2
     and not new.resultado_registrado then
    perform public.finalizar_partida_domino(new.id, 'empate');
  end if;
  return new;
end;
$$;

drop trigger if exists registrar_empate_domino_trigger on public.domino_salas;
create trigger registrar_empate_domino_trigger
after update of passadas_count on public.domino_salas
for each row execute function public.registrar_empate_domino_ao_trancar();

revoke all on function public.registrar_empate_domino_ao_trancar() from public, anon, authenticated;

create or replace function public.obter_ranking_domino(p_limite integer default 10)
returns table (
  usuario_id uuid,
  nome text,
  avatar_url text,
  vitorias integer,
  empates integer,
  derrotas integer,
  partidas_jogadas integer,
  pontuacao integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    estatistica.usuario_id,
    usuario.nome,
    usuario.foto_url as avatar_url,
    estatistica.vitorias,
    estatistica.empates,
    estatistica.derrotas,
    estatistica.partidas_jogadas,
    estatistica.pontuacao
  from public.domino_estatisticas as estatistica
  join public.usuarios as usuario on usuario.id = estatistica.usuario_id
  where auth.uid() is not null
  order by estatistica.pontuacao desc, estatistica.vitorias desc, estatistica.derrotas asc
  limit greatest(1, least(coalesce(p_limite, 10), 100));
$$;

revoke all on function public.obter_ranking_domino(integer) from public;
revoke all on function public.obter_ranking_domino(integer) from anon;
grant execute on function public.obter_ranking_domino(integer) to authenticated;

drop policy if exists domino_estatisticas_auth_policy on public.domino_estatisticas;
drop policy if exists "Permitir leitura pública das estatísticas" on public.domino_estatisticas;
create policy "Jogadores autenticados podem ver o ranking"
on public.domino_estatisticas
for select
to authenticated
using (true);

revoke select on public.domino_estatisticas from anon;
grant select on public.domino_estatisticas to authenticated;
revoke insert, update, delete on public.domino_estatisticas from anon, authenticated;
