-- Retorna somente os dados públicos necessários ao lobby do dominó.
-- A função evita abrir a tabela de usuários para leitura entre contas.
create or replace function public.obter_lobby_domino()
returns table (
  id uuid,
  numero_sala integer,
  status text,
  jogador_1_id uuid,
  jogador_2_id uuid,
  jogador_1_nome text,
  jogador_2_nome text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sala.id,
    sala.numero_sala,
    sala.status,
    sala.jogador_1_id,
    sala.jogador_2_id,
    jogador_1.nome as jogador_1_nome,
    jogador_2.nome as jogador_2_nome
  from public.domino_salas as sala
  left join public.usuarios as jogador_1 on jogador_1.id = sala.jogador_1_id
  left join public.usuarios as jogador_2 on jogador_2.id = sala.jogador_2_id
  where auth.uid() is not null
  order by sala.numero_sala asc;
$$;

revoke all on function public.obter_lobby_domino() from public;
revoke all on function public.obter_lobby_domino() from anon;
grant execute on function public.obter_lobby_domino() to authenticated;

