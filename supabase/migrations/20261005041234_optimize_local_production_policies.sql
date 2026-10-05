create index if not exists produtores_locais_empresa_id_idx
  on public.produtores_locais (empresa_id);
create index if not exists produtores_locais_revisado_por_idx
  on public.produtores_locais (revisado_por);

drop policy if exists "Visitantes leem produtores aprovados" on public.produtores_locais;
drop policy if exists "Usuario le o proprio cadastro rural" on public.produtores_locais;
drop policy if exists "Usuario cria o proprio cadastro rural pendente" on public.produtores_locais;
drop policy if exists "Usuario atualiza o proprio cadastro rural para nova analise" on public.produtores_locais;
drop policy if exists "Usuario exclui o proprio cadastro rural" on public.produtores_locais;
drop policy if exists "Administradores moderam produtores locais" on public.produtores_locais;

create policy "Visitantes leem produtores aprovados"
  on public.produtores_locais for select
  to anon
  using (status = 'aprovado' and ativo = true and consentimento_publicacao = true);

create policy "Contas autenticadas leem produtores autorizados"
  on public.produtores_locais for select
  to authenticated
  using (
    (status = 'aprovado' and ativo = true and consentimento_publicacao = true)
    or (select auth.uid()) = usuario_id
    or private.admin_mfa_verified(null, false)
  );

create policy "Contas autenticadas criam produtores autorizados"
  on public.produtores_locais for insert
  to authenticated
  with check (
    private.admin_mfa_verified(null, false)
    or (
      (select auth.uid()) = usuario_id
      and status = 'pendente'
      and ativo = false
      and consentimento_publicacao = true
      and revisado_por is null
      and revisado_em is null
    )
  );

create policy "Contas autenticadas atualizam produtores autorizados"
  on public.produtores_locais for update
  to authenticated
  using (
    private.admin_mfa_verified(null, false)
    or (select auth.uid()) = usuario_id
  )
  with check (
    private.admin_mfa_verified(null, false)
    or (
      (select auth.uid()) = usuario_id
      and status = 'pendente'
      and ativo = false
      and consentimento_publicacao = true
      and revisado_por is null
      and revisado_em is null
    )
  );

create policy "Contas autenticadas excluem produtores autorizados"
  on public.produtores_locais for delete
  to authenticated
  using (
    private.admin_mfa_verified(null, false)
    or (select auth.uid()) = usuario_id
  );
