drop policy if exists "Todos podem ver configurações ativas de menu"
  on public.menu_configuracoes;

-- Itens inativos também precisam ser legíveis pelo cliente para que o menu
-- consiga distingui-los de itens novos sem configuração. Não há dados privados
-- nesta tabela e as escritas continuam exclusivas do painel com MFA.
create policy "Todos podem ler configuracoes de menu"
  on public.menu_configuracoes for select
  to anon, authenticated
  using (true);
