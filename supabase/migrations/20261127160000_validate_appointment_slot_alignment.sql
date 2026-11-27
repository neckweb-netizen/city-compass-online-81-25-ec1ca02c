CREATE OR REPLACE FUNCTION public.validar_agendamento_antes_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_empresa public.empresas%rowtype;
  v_servico public.servicos_agendamento%rowtype;
  v_data_local timestamp;
  v_data_fim timestamptz;
begin
  select * into v_empresa from public.empresas
  where id = new.empresa_id and ativo = true and status_aprovacao = 'aprovado' and agendamentos_ativo = true;
  if not found then raise exception 'Esta empresa não está aceitando agendamentos no momento'; end if;

  select * into v_servico from public.servicos_agendamento
  where empresa_id = new.empresa_id and ativo = true
    and (id = new.servico_id or lower(trim(nome_servico)) = lower(trim(new.servico)))
  order by (id = new.servico_id) desc limit 1;
  if not found then raise exception 'O serviço selecionado não está disponível'; end if;

  new.nome_cliente := trim(new.nome_cliente);
  new.telefone_cliente := trim(new.telefone_cliente);
  new.observacoes := nullif(trim(new.observacoes), '');
  new.servico_id := v_servico.id;
  new.servico := v_servico.nome_servico;
  new.duracao_minutos := v_servico.duracao_minutos;
  new.cliente_usuario_id := coalesce(new.cliente_usuario_id, auth.uid());

  if char_length(new.nome_cliente) not between 3 and 120 then raise exception 'Informe um nome válido'; end if;
  if char_length(regexp_replace(new.telefone_cliente, '[^0-9]', '', 'g')) not between 10 and 13 then raise exception 'Informe um telefone válido com DDD'; end if;
  if char_length(coalesce(new.observacoes,'')) > 1000 then raise exception 'As observações podem ter no máximo 1000 caracteres'; end if;

  v_data_local := new.data_agendamento at time zone 'America/Bahia';
  if new.data_agendamento < now() + make_interval(mins => v_empresa.agendamento_antecedencia_minutos) then
    raise exception 'Este horário não respeita a antecedência mínima';
  end if;
  if new.data_agendamento > now() + make_interval(days => v_empresa.agendamento_max_dias) then
    raise exception 'Este horário está além do período permitido para reservas';
  end if;
  if not (extract(isodow from v_data_local)::smallint = any(v_empresa.agendamento_dias_semana)) then
    raise exception 'A empresa não atende neste dia da semana';
  end if;
  if v_data_local::time < v_empresa.agendamento_hora_inicio
     or (v_data_local + make_interval(mins => v_servico.duracao_minutos)) > (v_data_local::date + v_empresa.agendamento_hora_fim) then
    raise exception 'O serviço não cabe no horário de atendimento';
  end if;

  if coalesce(v_empresa.agendamento_intervalo_minutos, 0) <= 0 then
    raise exception 'Intervalo de atendimento inválido';
  end if;
  if mod(extract(epoch from (v_data_local - (v_data_local::date + v_empresa.agendamento_hora_inicio))), v_empresa.agendamento_intervalo_minutos * 60) <> 0 then
    raise exception 'Escolha um dos horários disponibilizados pela empresa' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.empresa_id::text || v_data_local::date::text, 0));
  v_data_fim := new.data_agendamento + make_interval(mins => v_servico.duracao_minutos);
  if exists (
    select 1 from public.agendamentos a
    where a.empresa_id = new.empresa_id and a.status in ('pendente','confirmado')
      and a.id <> coalesce(new.id, gen_random_uuid())
      and tstzrange(a.data_agendamento, a.data_agendamento + make_interval(mins => a.duracao_minutos), '[)')
          && tstzrange(new.data_agendamento, v_data_fim, '[)')
  ) then raise exception 'Este horário acabou de ser reservado. Escolha outro horário'; end if;

  return new;
end;
$function$
