
-- Função para buscar resultado de sorteio por canal informativo
CREATE OR REPLACE FUNCTION public.buscar_resultado_sorteio(canal_id uuid)
RETURNS TABLE(
  id uuid,
  data_sorteio date,
  premios jsonb
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    rs.id,
    rs.data_sorteio,
    rs.premios
  FROM public.resultados_sorteio rs
  WHERE rs.canal_informativo_id = canal_id
  LIMIT 1;
END;
$function$;

-- Função para criar resultado de sorteio
CREATE OR REPLACE FUNCTION public.criar_resultado_sorteio(
  canal_id uuid,
  data_sorteio_param date,
  premios_param jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.resultados_sorteio (
    canal_informativo_id,
    data_sorteio,
    premios
  ) VALUES (
    canal_id,
    data_sorteio_param,
    premios_param
  );
END;
$function$;
