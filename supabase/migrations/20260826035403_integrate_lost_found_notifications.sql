alter table public.achados_perdidos
  add column if not exists usuario_id uuid references auth.users(id) on delete set null;

create index if not exists achados_perdidos_usuario_idx
  on public.achados_perdidos(usuario_id, created_at desc)
  where usuario_id is not null;

-- O autor logado passa a enxergar inclusive seus itens pendentes.
drop policy if exists "Qualquer pessoa pode visualizar itens aprovados" on public.achados_perdidos;
create policy "Itens publicados ou do proprio autor"
on public.achados_perdidos for select
using (
  status in ('aprovado','resolvido')
  or usuario_id = (select auth.uid())
  or public.is_admin((select auth.uid()))
);

drop policy if exists "Inserir item de achados e perdidos com validação" on public.achados_perdidos;
create policy "Inserir item de achados e perdidos com validacao"
on public.achados_perdidos for insert
to anon, authenticated
with check (
  titulo is not null and length(btrim(titulo)) > 0
  and (usuario_id is null or usuario_id = (select auth.uid()))
);

drop policy if exists "Autor pode marcar achado como resolvido" on public.achados_perdidos;
create policy "Autor pode marcar achado como resolvido"
on public.achados_perdidos for update
to authenticated
using (usuario_id = (select auth.uid()) and status = 'aprovado')
with check (usuario_id = (select auth.uid()) and status = 'resolvido');

-- Remove privilegios excessivos antigos e libera somente o necessario.
revoke update, delete, truncate, references, trigger on public.achados_perdidos from anon;
revoke update, truncate, references, trigger on public.achados_perdidos from authenticated;
grant select, insert on public.achados_perdidos to anon, authenticated;
grant update (status) on public.achados_perdidos to authenticated;
grant delete on public.achados_perdidos to authenticated;

create or replace function private.preparar_achado_perdido()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if auth.uid() is not null then new.usuario_id := auth.uid(); end if;
  new.titulo := private.censurar_xingamentos(new.titulo);
  new.descricao := private.censurar_xingamentos(new.descricao);
  new.local_fato := private.censurar_xingamentos(new.local_fato);
  return new;
end;
$$;

revoke all on function private.preparar_achado_perdido() from public, anon, authenticated;
drop trigger if exists preparar_achado_perdido on public.achados_perdidos;
create trigger preparar_achado_perdido
before insert or update of titulo, descricao, local_fato on public.achados_perdidos
for each row execute function private.preparar_achado_perdido();

create or replace function private.notificar_achado_perdido()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (
      user_id,title,message,category,priority,action_url,action_label,metadata
    )
    select
      u.id,
      'Novo item em Achados e Perdidos',
      'Uma publicação está aguardando moderação: "'||left(new.titulo,80)||'".',
      'community','normal','/admin/achados-e-perdidos','Analisar item',
      jsonb_build_object('event','lost_found_pending','item_id',new.id)
    from public.usuarios u
    where u.tipo_conta::text in ('admin_geral','admin_cidade');

  elsif tg_op = 'UPDATE' and old.status is distinct from new.status and new.usuario_id is not null then
    insert into public.notifications (
      user_id,title,message,category,priority,action_url,action_label,metadata
    ) values (
      new.usuario_id,
      case new.status
        when 'aprovado' then 'Publicação aprovada'
        when 'rejeitado' then 'Publicação não aprovada'
        when 'resolvido' then 'Item marcado como resolvido'
        else 'Status da publicação atualizado'
      end,
      case new.status
        when 'aprovado' then 'Seu item "'||left(new.titulo,80)||'" já está visível em Achados e Perdidos.'
        when 'rejeitado' then 'Seu item "'||left(new.titulo,80)||'" não foi aprovado pela moderação.'
        when 'resolvido' then 'O item "'||left(new.titulo,80)||'" foi marcado como resolvido.'
        else 'O status do item "'||left(new.titulo,80)||'" foi atualizado.'
      end,
      'community',
      case when new.status='rejeitado' then 'high' else 'normal' end,
      '/achados-e-perdidos','Abrir Achados e Perdidos',
      jsonb_build_object('event','lost_found_status','item_id',new.id,'status',new.status)
    );
  end if;
  return new;
end;
$$;

revoke all on function private.notificar_achado_perdido() from public, anon, authenticated;
drop trigger if exists notificar_achado_perdido on public.achados_perdidos;
create trigger notificar_achado_perdido
after insert or update of status on public.achados_perdidos
for each row execute function private.notificar_achado_perdido();
