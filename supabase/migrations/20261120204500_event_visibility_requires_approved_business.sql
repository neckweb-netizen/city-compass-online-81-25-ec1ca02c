-- Suspended or unapproved businesses cannot keep events visible in the public catalog.
-- Independent events formally approved by administrators (empresa_id is null) remain visible.
drop policy if exists "Todos podem ver eventos aprovados" on public.eventos;
create policy "Todos podem ver eventos aprovados" on public.eventos
for select to public
using (
  ativo = true
  and status_aprovacao = 'aprovado'
  and (
    empresa_id is null
    or exists (
      select 1 from public.empresas e
      where e.id = eventos.empresa_id and e.ativo = true
        and e.status_aprovacao = 'aprovado'
    )
  )
);
