-- Protege privilégios e escopo municipal contra alterações via cliente.
-- Antes desta migração, contas comuns conseguiam alterar plano_data_vencimento,
-- e administradores municipais conseguiam alterar cidade_id no próprio perfil.
CREATE OR REPLACE FUNCTION private.protect_user_sensitive_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
begin
  if jwt_role = 'service_role' or private.admin_mfa_verified(null, true) then
    return new;
  end if;

  if (select auth.uid()) is distinct from old.id
     and not private.admin_mfa_verified(old.cidade_id, false) then
    raise exception 'Sem permissão para alterar este perfil' using errcode = '42501';
  end if;

  new.id := old.id;
  new.email := old.email;
  new.tipo_conta := old.tipo_conta;
  new.cidade_id := old.cidade_id;
  new.plano_id := old.plano_id;
  new.plano_data_vencimento := old.plano_data_vencimento;
  new.total_points := old.total_points;
  new.current_level := old.current_level;
  new.weekly_points := old.weekly_points;
  new.monthly_points := old.monthly_points;
  new.badges_count := old.badges_count;
  new.criado_em := old.criado_em;
  return new;
end;
$function$;

REVOKE ALL ON FUNCTION private.protect_user_sensitive_profile_fields()
FROM PUBLIC, anon, authenticated;
