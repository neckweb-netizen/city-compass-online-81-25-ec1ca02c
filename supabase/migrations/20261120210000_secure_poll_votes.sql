-- Enquetes: validação no banco e votação individual autenticada.
-- Preserva os votos existentes e a assinatura RPC usada pelos clientes.
alter table public.enquetes
  add constraint enquetes_periodo_valido check (data_fim is null or data_fim > data_inicio),
  add constraint enquetes_opcoes_validas check (
    jsonb_typeof(opcoes) = 'array' and jsonb_array_length(opcoes) between 2 and 20
  ),
  add constraint enquetes_titulo_valido check (length(btrim(titulo)) between 3 and 200);

-- Não permitir inserções avulsas; o voto deve passar pela função transacional.
revoke insert, update, delete on public.respostas_enquete from public, anon, authenticated;
drop policy if exists "Usuários podem votar em enquetes" on public.respostas_enquete;

create or replace function public.votar_enquete(
  enquete_id_param uuid, opcoes_indices integer[],
  ip_param text default null, user_agent_param text default null
) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_opcoes jsonb;
  v_multipla boolean;
  v_indice integer;
begin
  if v_usuario is null or opcoes_indices is null or cardinality(opcoes_indices) = 0 then
    return false;
  end if;
  -- Mesma enquete + mesmo usuário sempre são processados sequencialmente.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(enquete_id_param::text || ':' || v_usuario::text, 0)
  );
  select e.opcoes, e.multipla_escolha into v_opcoes, v_multipla
  from public.enquetes e
  where e.id = enquete_id_param and e.ativo
    and e.data_inicio <= now()
    and (e.data_fim is null or e.data_fim >= now());
  if not found or jsonb_typeof(v_opcoes) <> 'array' then return false; end if;
  if not v_multipla and cardinality(opcoes_indices) <> 1 then return false; end if;
  if cardinality(opcoes_indices) > jsonb_array_length(v_opcoes)
     or cardinality(opcoes_indices) > 20 then return false; end if;
  if exists (
    select 1 from pg_catalog.unnest(opcoes_indices) as x(indice)
    where x.indice < 0 or x.indice >= jsonb_array_length(v_opcoes)
  ) then return false; end if;
  if (select count(distinct x.indice) from pg_catalog.unnest(opcoes_indices) x(indice))
     <> cardinality(opcoes_indices) then return false; end if;
  if exists (
    select 1 from public.respostas_enquete r
    where r.enquete_id = enquete_id_param and r.usuario_id = v_usuario
  ) then return false; end if;
  foreach v_indice in array opcoes_indices loop
    insert into public.respostas_enquete (enquete_id, opcao_indice, usuario_id, ip_address, user_agent)
    values (enquete_id_param, v_indice, v_usuario, null, null);
  end loop;
  return true;
end;
$$;
revoke execute on function public.votar_enquete(uuid,integer[],text,text) from public, anon;
grant execute on function public.votar_enquete(uuid,integer[],text,text) to authenticated;
