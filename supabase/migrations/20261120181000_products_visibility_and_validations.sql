-- Public product discovery must not expose products from suspended/pending companies.
drop policy if exists "Produtos ativos são visíveis para todos" on public.produtos;
create policy "Produtos ativos são visíveis para todos" on public.produtos
  as permissive for select to public
  using (
    ativo = true and exists (
      select 1 from public.empresas e
      where e.id = produtos.empresa_id
        and e.ativo = true
        and e.status_aprovacao = 'aprovado'
    )
  );

-- The database validates prices and stock regardless of which client sends the request.
alter table public.produtos
  add constraint produtos_preco_original_positivo check (preco_original > 0),
  add constraint produtos_preco_promocional_positivo check (preco_promocional is null or preco_promocional > 0),
  add constraint produtos_estoque_nao_negativo check (estoque_disponivel is null or estoque_disponivel >= 0);
