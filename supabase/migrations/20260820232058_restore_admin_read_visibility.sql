-- The former ALL restrictive policy also filtered SELECT and made the admin
-- catalogue look empty. Keep MFA as a restrictive condition only for writes.
do $$
declare
  target record;
begin
  for target in
    select schemaname, tablename
    from pg_policies
    where policyname = 'Administradores exigem MFA'
  loop
    execute format(
      'drop policy %I on %I.%I',
      'Administradores exigem MFA',
      target.schemaname,
      target.tablename
    );

    execute format(
      'create policy %I on %I.%I as restrictive for insert to authenticated with check (private.admin_mfa_policy_passes())',
      'Administradores exigem MFA para inserir',
      target.schemaname,
      target.tablename
    );
    execute format(
      'create policy %I on %I.%I as restrictive for update to authenticated using (private.admin_mfa_policy_passes()) with check (private.admin_mfa_policy_passes())',
      'Administradores exigem MFA para atualizar',
      target.schemaname,
      target.tablename
    );
    execute format(
      'create policy %I on %I.%I as restrictive for delete to authenticated using (private.admin_mfa_policy_passes())',
      'Administradores exigem MFA para excluir',
      target.schemaname,
      target.tablename
    );
  end loop;
end;
$$;
