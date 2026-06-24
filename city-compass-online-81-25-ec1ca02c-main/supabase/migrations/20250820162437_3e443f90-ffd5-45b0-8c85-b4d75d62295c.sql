-- Passo 1: Corrigir funções sem search_path definido
-- Estas funções precisam ter search_path explícito por segurança

-- 1.1 Corrigir função votar_enquete
CREATE OR REPLACE FUNCTION public.votar_enquete(enquete_id_param uuid, opcoes_indices integer[], ip_param text DEFAULT NULL::text, user_agent_param text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  enquete_valida BOOLEAN := false;
  ja_votou BOOLEAN := false;
  opcao_indice INTEGER;
BEGIN
  -- Verificar se enquete existe e está ativa
  SELECT EXISTS(
    SELECT 1 FROM public.enquetes 
    WHERE id = enquete_id_param 
    AND ativo = true 
    AND data_inicio <= now() 
    AND (data_fim IS NULL OR data_fim >= now())
  ) INTO enquete_valida;
  
  IF NOT enquete_valida THEN
    RETURN false;
  END IF;
  
  -- Verificar se já votou (por IP ou usuário)
  SELECT EXISTS(
    SELECT 1 FROM public.respostas_enquete 
    WHERE enquete_id = enquete_id_param 
    AND (
      (auth.uid() IS NOT NULL AND usuario_id = auth.uid()) OR
      (auth.uid() IS NULL AND ip_address = ip_param)
    )
  ) INTO ja_votou;
  
  IF ja_votou THEN
    RETURN false;
  END IF;
  
  -- Inserir votos
  FOREACH opcao_indice IN ARRAY opcoes_indices
  LOOP
    INSERT INTO public.respostas_enquete (
      enquete_id, 
      opcao_indice, 
      ip_address, 
      user_agent, 
      usuario_id
    ) VALUES (
      enquete_id_param, 
      opcao_indice, 
      ip_param, 
      user_agent_param, 
      auth.uid()
    );
  END LOOP;
  
  RETURN true;
END;
$function$;

-- 1.2 Corrigir função generate_short_code
CREATE OR REPLACE FUNCTION public.generate_short_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM public.short_urls WHERE short_code = result) INTO code_exists;
    
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN result;
END;
$function$;

-- 1.3 Corrigir função increment_url_clicks
CREATE OR REPLACE FUNCTION public.increment_url_clicks(code text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  original_url_result TEXT;
BEGIN
  UPDATE public.short_urls 
  SET clicks = clicks + 1, updated_at = now()
  WHERE short_code = code 
    AND (expires_at IS NULL OR expires_at > now())
  RETURNING original_url INTO original_url_result;
  
  RETURN original_url_result;
END;
$function$;