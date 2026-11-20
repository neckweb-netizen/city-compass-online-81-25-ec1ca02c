-- Validations independent of web/mobile clients, keeping slot generation deterministic.
alter table public.servicos_agendamento
  add constraint servicos_agendamento_nome_valido
  check (char_length(btrim(nome_servico)) between 2 and 160),
  add constraint servicos_agendamento_duracao_valida
  check (duracao_minutos between 5 and 1440),
  add constraint servicos_agendamento_preco_valido
  check (preco is null or preco >= 0);

-- The public booking RPC selects a service by name: prevent ambiguous duplicates.
create unique index if not exists servicos_agendamento_empresa_nome_unique
  on public.servicos_agendamento (empresa_id, lower(btrim(nome_servico)));
