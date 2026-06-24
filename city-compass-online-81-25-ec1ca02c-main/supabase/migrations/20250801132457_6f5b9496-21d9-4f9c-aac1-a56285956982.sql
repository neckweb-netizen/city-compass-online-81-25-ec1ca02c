-- Função para atualizar horário de funcionamento das empresas
CREATE OR REPLACE FUNCTION public.atualizar_horario_funcionamento(empresa_id_param uuid, horarios_param jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    UPDATE public.empresas 
    SET 
        horario_funcionamento = horarios_param,
        atualizado_em = now()
    WHERE id = empresa_id_param;
END;
$$;