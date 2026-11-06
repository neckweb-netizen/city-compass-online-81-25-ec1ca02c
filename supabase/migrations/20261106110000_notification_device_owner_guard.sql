-- Impede que outro usuario tome posse de um FID Firebase ainda ativo.
CREATE OR REPLACE FUNCTION public.register_notification_device(
  p_registration_id text,
  p_target_type text DEFAULT 'fid'::text,
  p_platform text DEFAULT 'web'::text,
  p_device_name text DEFAULT NULL::text,
  p_user_agent text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_device_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autenticacao obrigatoria' USING ERRCODE='42501';
  END IF;
  IF char_length(trim(coalesce(p_registration_id, ''))) NOT BETWEEN 10 AND 4096 THEN
    RAISE EXCEPTION 'Identificador Firebase invalido' USING ERRCODE='22023';
  END IF;
  IF p_target_type NOT IN ('fid','token') OR p_platform NOT IN ('web','pwa','android','ios') THEN
    RAISE EXCEPTION 'Parametros invalidos' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.notification_devices (
    user_id, registration_id, target_type, platform, device_name, user_agent,
    enabled, revoked_at, last_seen_at, updated_at
  ) VALUES (
    v_user_id, trim(p_registration_id), p_target_type, p_platform,
    left(nullif(trim(coalesce(p_device_name,'')),''),200),
    left(nullif(trim(coalesce(p_user_agent,'')),''),1000),
    true, null, now(), now()
  )
  ON CONFLICT (registration_id) DO UPDATE SET
    user_id = v_user_id,
    target_type = excluded.target_type,
    platform = excluded.platform,
    device_name = excluded.device_name,
    user_agent = excluded.user_agent,
    enabled = true,
    revoked_at = null,
    last_seen_at = now(),
    updated_at = now()
  WHERE public.notification_devices.user_id = v_user_id
     OR (public.notification_devices.enabled = false
         AND public.notification_devices.revoked_at IS NOT NULL)
  RETURNING id INTO v_device_id;
  IF v_device_id IS NULL THEN
    RAISE EXCEPTION 'Dispositivo ja vinculado a outra conta ativa'
      USING ERRCODE='42501';
  END IF;
  RETURN v_device_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.register_notification_device(text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_notification_device(text,text,text,text,text) TO authenticated;
