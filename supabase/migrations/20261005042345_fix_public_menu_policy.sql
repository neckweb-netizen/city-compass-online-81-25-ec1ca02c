drop policy if exists "Admins podem gerenciar configurações de menu"
  on public.menu_configuracoes;

create policy "Admins podem gerenciar configurações de menu"
  on public.menu_configuracoes for all
  to authenticated
  using (private.admin_mfa_verified(null, false))
  with check (private.admin_mfa_verified(null, false));
