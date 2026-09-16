-- Explicit, expiring exception for plans assigned by an administrator without
-- a matching confirmed payment record. Never exposed to visitors or companies.
create policy ai_company_access_admin_read on public.ai_company_access
  for select to authenticated using (private.admin_mfa_verified(null, true));
create policy ai_company_access_admin_insert on public.ai_company_access
  for insert to authenticated with check (private.admin_mfa_verified(null, true));
create policy ai_company_access_admin_update on public.ai_company_access
  for update to authenticated
  using (private.admin_mfa_verified(null, true))
  with check (private.admin_mfa_verified(null, true));
grant select, insert, update (manual_grant_until, manual_grant_reason, updated_by, updated_at)
  on public.ai_company_access to authenticated;

create or replace function private.ai_stamp_company_access()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.ai_stamp_company_access() from public, anon, authenticated;
create trigger ai_company_access_stamp before insert or update on public.ai_company_access
  for each row execute function private.ai_stamp_company_access();
