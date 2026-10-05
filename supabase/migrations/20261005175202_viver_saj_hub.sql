-- Central Viver SAJ: módulos públicos organizados, pedidos locais, saúde e inovação.
-- Toda escrita administrativa exige a mesma validação de MFA usada pelo painel.

create table public.viver_saj_modulos (
  chave text primary key check (chave in ('desejos', 'saude', 'feito_saj', 'agora', 'inovacao', 'mobilidade')),
  titulo text not null check (char_length(titulo) between 3 and 60),
  descricao text not null check (char_length(descricao) between 10 and 220),
  ordem smallint not null check (ordem between 1 and 20),
  ativo boolean not null default true,
  atualizado_em timestamptz not null default now()
);

insert into public.viver_saj_modulos (chave, titulo, descricao, ordem, ativo) values
  ('desejos', 'Estou procurando', 'Conte o que precisa e receba respostas de empresas compatíveis, sem catálogo aleatório.', 1, true),
  ('saude', 'Saúde Agora', 'Encontre serviços públicos e essenciais com informação clara de atendimento.', 2, true),
  ('feito_saj', 'Feito em SAJ', 'Produtos, marcas, artesãos e negócios que produzem em Santo Antônio de Jesus.', 3, true),
  ('agora', 'SAJ Agora', 'Uma agenda simples do que acontece hoje e nos próximos dias.', 4, true),
  ('inovacao', 'Desafios da cidade', 'Problemas reais que podem receber propostas de pessoas, empresas e instituições.', 5, true),
  ('mobilidade', 'Mobilidade', 'Táxi, transporte, aluguel e serviços para se deslocar pela cidade.', 6, true)
on conflict (chave) do update set
  titulo = excluded.titulo,
  descricao = excluded.descricao;

create index viver_saj_modulos_ordem_idx on public.viver_saj_modulos (ordem);

create table public.pedidos_locais (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null check (char_length(titulo) between 3 and 120),
  descricao text not null check (char_length(descricao) between 10 and 1200),
  categoria text not null check (char_length(categoria) between 2 and 60),
  bairro text check (bairro is null or char_length(bairro) <= 80),
  faixa_orcamento text check (faixa_orcamento is null or char_length(faixa_orcamento) <= 80),
  prazo text check (prazo is null or char_length(prazo) <= 80),
  receber_ofertas boolean not null default true,
  status text not null default 'aberto' check (status in ('aberto', 'atendido', 'encerrado', 'rejeitado')),
  revisado_por uuid references auth.users(id) on delete set null,
  revisado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index pedidos_locais_publicacao_idx on public.pedidos_locais (status, receber_ofertas, criado_em desc);
create index pedidos_locais_usuario_idx on public.pedidos_locais (usuario_id, criado_em desc);

create table public.pedido_local_respostas (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos_locais(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  mensagem text not null check (char_length(mensagem) between 5 and 700),
  preco_estimado text check (preco_estimado is null or char_length(preco_estimado) <= 80),
  status text not null default 'enviada' check (status in ('enviada', 'aceita', 'recusada')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint resposta_unica_por_empresa unique (pedido_id, empresa_id)
);

create index pedido_respostas_destino_idx on public.pedido_local_respostas (pedido_id, criado_em desc);

create table public.servicos_saude_saj (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 3 and 140),
  tipo text not null check (tipo in ('upa', 'hospital', 'ubs', 'caps', 'farmacia_publica', 'hemocentro', 'laboratorio', 'clinica', 'farmacia', 'outro')),
  descricao text check (descricao is null or char_length(descricao) <= 700),
  endereco text check (endereco is null or char_length(endereco) <= 220),
  bairro text check (bairro is null or char_length(bairro) <= 100),
  telefone text check (telefone is null or char_length(telefone) <= 30),
  horario text check (horario is null or char_length(horario) <= 160),
  atendimento_sus boolean not null default false,
  atendimento_24h boolean not null default false,
  servicos text[] not null default '{}'::text[] check (cardinality(servicos) <= 30),
  fonte_nome text,
  fonte_url text,
  verificado_em date,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index servicos_saude_publicos_idx on public.servicos_saude_saj (ativo, atendimento_24h desc, tipo, nome);

insert into public.servicos_saude_saj
  (nome, tipo, descricao, endereco, bairro, telefone, horario, atendimento_sus, atendimento_24h, servicos, fonte_nome, fonte_url, verificado_em)
values
  ('UPA 24 Horas Antônio Reginaldo Fernandes dos Santos', 'upa', 'Unidade pública de urgência e emergência.', 'Rua Valdemar Neiva, 67', 'Urbis III', null, 'Atendimento 24 horas', true, true, array['Urgência', 'Emergência'], 'CNES — Ministério da Saúde', 'https://cnes.datasus.gov.br/', '2026-08-01'),
  ('Hospital Regional de Santo Antônio de Jesus', 'hospital', 'Hospital regional com atendimento de urgência e serviços de internação.', 'Rua Cosme e Damião', 'Andaiá', '(75) 3162-1400', 'Atendimento 24 horas', true, true, array['Urgência', 'Internação', 'UTI'], 'CNES — Ministério da Saúde', 'https://cnes.datasus.gov.br/', '2026-08-01')
on conflict do nothing;

create table public.desafios_inovacao (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 5 and 140),
  descricao text not null check (char_length(descricao) between 20 and 2000),
  area text not null check (char_length(area) between 2 and 80),
  proponente text check (proponente is null or char_length(proponente) <= 120),
  prazo date,
  status text not null default 'rascunho' check (status in ('rascunho', 'publicado', 'encerrado')),
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index desafios_inovacao_publicos_idx on public.desafios_inovacao (status, prazo, criado_em desc);

create table public.solucoes_inovacao (
  id uuid primary key default gen_random_uuid(),
  desafio_id uuid not null references public.desafios_inovacao(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  nome_proponente text not null check (char_length(nome_proponente) between 3 and 120),
  tipo_proponente text not null check (tipo_proponente in ('pessoa', 'empresa', 'instituicao', 'coletivo')),
  resumo text not null check (char_length(resumo) between 20 and 1800),
  contato text check (contato is null or char_length(contato) <= 140),
  status text not null default 'recebida' check (status in ('recebida', 'em_analise', 'selecionada', 'arquivada')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index solucoes_inovacao_desafio_idx on public.solucoes_inovacao (desafio_id, criado_em desc);

create trigger viver_saj_modulos_updated_at before update on public.viver_saj_modulos
  for each row execute function public.update_updated_at_column();
create trigger pedidos_locais_updated_at before update on public.pedidos_locais
  for each row execute function public.update_updated_at_column();
create trigger pedido_local_respostas_updated_at before update on public.pedido_local_respostas
  for each row execute function public.update_updated_at_column();
create trigger servicos_saude_saj_updated_at before update on public.servicos_saude_saj
  for each row execute function public.update_updated_at_column();
create trigger desafios_inovacao_updated_at before update on public.desafios_inovacao
  for each row execute function public.update_updated_at_column();
create trigger solucoes_inovacao_updated_at before update on public.solucoes_inovacao
  for each row execute function public.update_updated_at_column();

alter table public.viver_saj_modulos enable row level security;
alter table public.pedidos_locais enable row level security;
alter table public.pedido_local_respostas enable row level security;
alter table public.servicos_saude_saj enable row level security;
alter table public.desafios_inovacao enable row level security;
alter table public.solucoes_inovacao enable row level security;

revoke all on table public.viver_saj_modulos, public.pedidos_locais, public.pedido_local_respostas,
  public.servicos_saude_saj, public.desafios_inovacao, public.solucoes_inovacao from anon, authenticated;

grant select on table public.viver_saj_modulos, public.servicos_saude_saj, public.desafios_inovacao to anon, authenticated;
grant select, insert, update, delete on table public.pedidos_locais, public.pedido_local_respostas,
  public.solucoes_inovacao to authenticated;
grant insert on table public.solucoes_inovacao to authenticated;
grant select, insert, update, delete on table public.viver_saj_modulos, public.servicos_saude_saj,
  public.desafios_inovacao to authenticated;

create policy "Publico le modulos ativos" on public.viver_saj_modulos for select
  to anon, authenticated using (ativo = true);
create policy "Admins gerenciam modulos Viver SAJ" on public.viver_saj_modulos for all
  to authenticated using (private.admin_mfa_verified(null, false))
  with check (private.admin_mfa_verified(null, false));

create policy "Usuario le os proprios pedidos" on public.pedidos_locais for select
  to authenticated using ((select auth.uid()) = usuario_id);
create policy "Empresas leem pedidos abertos" on public.pedidos_locais for select
  to authenticated using (
    status = 'aberto' and receber_ofertas = true and exists (
      select 1 from public.empresas e where e.usuario_id = (select auth.uid()) and e.ativo = true
    )
  );
create policy "Usuario cria o proprio pedido" on public.pedidos_locais for insert
  to authenticated with check (
    (select auth.uid()) = usuario_id and status = 'aberto' and revisado_por is null and revisado_em is null
  );
create policy "Usuario atualiza o proprio pedido" on public.pedidos_locais for update
  to authenticated using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id and status in ('aberto', 'atendido', 'encerrado'));
create policy "Usuario exclui o proprio pedido" on public.pedidos_locais for delete
  to authenticated using ((select auth.uid()) = usuario_id);
create policy "Admins moderam pedidos locais" on public.pedidos_locais for all
  to authenticated using (private.admin_mfa_verified(null, false))
  with check (private.admin_mfa_verified(null, false));

create policy "Solicitante e empresa leem respostas" on public.pedido_local_respostas for select
  to authenticated using (
    usuario_id = (select auth.uid()) or exists (
      select 1 from public.pedidos_locais p where p.id = pedido_id and p.usuario_id = (select auth.uid())
    )
  );
create policy "Empresa responde com cadastro proprio" on public.pedido_local_respostas for insert
  to authenticated with check (
    usuario_id = (select auth.uid())
    and exists (select 1 from public.empresas e where e.id = empresa_id and e.usuario_id = (select auth.uid()) and e.ativo = true)
    and exists (select 1 from public.pedidos_locais p where p.id = pedido_id and p.status = 'aberto' and p.receber_ofertas = true)
  );
create policy "Empresa atualiza a propria resposta" on public.pedido_local_respostas for update
  to authenticated using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));
create policy "Empresa exclui a propria resposta" on public.pedido_local_respostas for delete
  to authenticated using (usuario_id = (select auth.uid()));
create policy "Admins gerenciam respostas locais" on public.pedido_local_respostas for all
  to authenticated using (private.admin_mfa_verified(null, false))
  with check (private.admin_mfa_verified(null, false));

create policy "Publico le servicos de saude ativos" on public.servicos_saude_saj for select
  to anon, authenticated using (ativo = true);
create policy "Admins gerenciam servicos de saude" on public.servicos_saude_saj for all
  to authenticated using (private.admin_mfa_verified(null, false))
  with check (private.admin_mfa_verified(null, false));

create policy "Publico le desafios publicados" on public.desafios_inovacao for select
  to anon, authenticated using (status = 'publicado');
create policy "Admins gerenciam desafios" on public.desafios_inovacao for all
  to authenticated using (private.admin_mfa_verified(null, false))
  with check (private.admin_mfa_verified(null, false));

create policy "Autor le a propria solucao" on public.solucoes_inovacao for select
  to authenticated using (usuario_id = (select auth.uid()));
create policy "Usuario envia solucao propria" on public.solucoes_inovacao for insert
  to authenticated with check (
    usuario_id = (select auth.uid()) and status = 'recebida'
    and exists (select 1 from public.desafios_inovacao d where d.id = desafio_id and d.status = 'publicado')
  );
create policy "Autor atualiza solucao recebida" on public.solucoes_inovacao for update
  to authenticated using (usuario_id = (select auth.uid()) and status = 'recebida')
  with check (usuario_id = (select auth.uid()) and status = 'recebida');
create policy "Autor exclui solucao recebida" on public.solucoes_inovacao for delete
  to authenticated using (usuario_id = (select auth.uid()) and status = 'recebida');
create policy "Admins gerenciam solucoes" on public.solucoes_inovacao for all
  to authenticated using (private.admin_mfa_verified(null, false))
  with check (private.admin_mfa_verified(null, false));

insert into public.home_sections_order (section_name, display_name, ordem, ativo)
select 'viver_saj', 'Viver SAJ', coalesce(max(ordem), 0) + 1, true from public.home_sections_order
on conflict (section_name) do update set display_name = excluded.display_name;

insert into public.menu_configuracoes
  (nome_item, rota, icone, posicao_desktop, posicao_mobile, ordem, apenas_admin, ativo)
select 'Viver SAJ', '/viver-saj', 'Landmark', 'sidebar', 'hamburger', 7, false, true
where not exists (select 1 from public.menu_configuracoes where rota = '/viver-saj');
