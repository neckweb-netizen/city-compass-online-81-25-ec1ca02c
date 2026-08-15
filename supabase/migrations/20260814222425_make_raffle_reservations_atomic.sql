-- Reserva e gerenciamento atomicos dos numeros da rifa.
-- A linha da rifa e bloqueada durante a alteracao para impedir reservas duplicadas
-- e sobrescritas causadas por navegadores com copias antigas da cartela.

create schema if not exists private;

alter table public.rifas_usuarios
  add column if not exists tipo_rifa text not null default 'fazendinha';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rifas_usuarios_tipo_rifa_check'
      and conrelid = 'public.rifas_usuarios'::regclass
  ) then
    alter table public.rifas_usuarios
      add constraint rifas_usuarios_tipo_rifa_check
      check (tipo_rifa in ('numerica', 'fazendinha'));
  end if;
end $$;

-- Esta politica antiga permitia que qualquer usuario autenticado alterasse
-- qualquer rifa. A politica de propriedade ja existente continua valendo.
drop policy if exists rifas_usuarios_auth_policy on public.rifas_usuarios;

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

  -- Visitantes so podem criar uma reserva nova. Qualquer outra transicao
  -- pertence exclusivamente ao organizador da rifa.
  if not v_eh_dono then
    if p_status <> 'reservado' then
      raise exception using errcode = '42501', message = 'Somente o organizador pode alterar esta reserva.';
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
grant usage on schema private to anon, authenticated, service_role;
grant execute on function private.atualizar_numero_rifa(uuid, text, text, text, text)
  to anon, authenticated, service_role;

-- Wrapper exposto pela Data API. Ele roda com os privilegios do chamador;
-- toda elevacao necessaria fica isolada na funcao validada do schema privado.
create or replace function public.atualizar_numero_rifa(
  p_rifa_id uuid,
  p_numero text,
  p_status text,
  p_nome text default null,
  p_telefone text default null
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.atualizar_numero_rifa(
    p_rifa_id,
    p_numero,
    p_status,
    p_nome,
    p_telefone
  );
$$;

revoke all on function public.atualizar_numero_rifa(uuid, text, text, text, text) from public;
grant execute on function public.atualizar_numero_rifa(uuid, text, text, text, text)
  to anon, authenticated, service_role;
