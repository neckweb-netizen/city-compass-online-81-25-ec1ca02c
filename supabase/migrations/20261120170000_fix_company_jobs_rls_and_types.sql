-- Access is limited to approved, active companies and their designated managers.
-- Existing admin policies and administrator MFA restrictions remain unchanged.
alter type public.tipo_vaga add value if not exists 'pj';
alter type public.tipo_vaga add value if not exists 'meio_periodo';
alter type public.tipo_vaga add value if not exists 'integral';

drop policy if exists "Empresas aprovadas podem ler suas vagas" on public.vagas_emprego;
create policy "Empresas aprovadas podem ler suas vagas"
  on public.vagas_emprego as permissive for select to authenticated
  using (exists (
  select 1 from public.empresas e
  where e.id = vagas_emprego.criado_por
    and e.ativo = true
    and e.status_aprovacao = 'aprovado'
    and (
      e.usuario_id = (select auth.uid())
      or exists (
        select 1 from public.usuario_empresa_admin ua
        where ua.empresa_id = e.id
          and ua.usuario_id = (select auth.uid())
          and ua.ativo = true
      )
    )
));

drop policy if exists "Empresas aprovadas podem publicar vagas" on public.vagas_emprego;
create policy "Empresas aprovadas podem publicar vagas"
  on public.vagas_emprego as permissive for insert to authenticated
  with check (exists (
  select 1 from public.empresas e
  where e.id = vagas_emprego.criado_por
    and e.ativo = true
    and e.status_aprovacao = 'aprovado'
    and (
      e.usuario_id = (select auth.uid())
      or exists (
        select 1 from public.usuario_empresa_admin ua
        where ua.empresa_id = e.id
          and ua.usuario_id = (select auth.uid())
          and ua.ativo = true
      )
    )
));

drop policy if exists "Empresas aprovadas podem atualizar suas vagas" on public.vagas_emprego;
create policy "Empresas aprovadas podem atualizar suas vagas"
  on public.vagas_emprego as permissive for update to authenticated
  using (exists (
  select 1 from public.empresas e
  where e.id = vagas_emprego.criado_por
    and e.ativo = true
    and e.status_aprovacao = 'aprovado'
    and (
      e.usuario_id = (select auth.uid())
      or exists (
        select 1 from public.usuario_empresa_admin ua
        where ua.empresa_id = e.id
          and ua.usuario_id = (select auth.uid())
          and ua.ativo = true
      )
    )
))
  with check (exists (
  select 1 from public.empresas e
  where e.id = vagas_emprego.criado_por
    and e.ativo = true
    and e.status_aprovacao = 'aprovado'
    and (
      e.usuario_id = (select auth.uid())
      or exists (
        select 1 from public.usuario_empresa_admin ua
        where ua.empresa_id = e.id
          and ua.usuario_id = (select auth.uid())
          and ua.ativo = true
      )
    )
));

drop policy if exists "Empresas aprovadas podem excluir suas vagas" on public.vagas_emprego;
create policy "Empresas aprovadas podem excluir suas vagas"
  on public.vagas_emprego as permissive for delete to authenticated
  using (exists (
  select 1 from public.empresas e
  where e.id = vagas_emprego.criado_por
    and e.ativo = true
    and e.status_aprovacao = 'aprovado'
    and (
      e.usuario_id = (select auth.uid())
      or exists (
        select 1 from public.usuario_empresa_admin ua
        where ua.empresa_id = e.id
          and ua.usuario_id = (select auth.uid())
          and ua.ativo = true
      )
    )
));
