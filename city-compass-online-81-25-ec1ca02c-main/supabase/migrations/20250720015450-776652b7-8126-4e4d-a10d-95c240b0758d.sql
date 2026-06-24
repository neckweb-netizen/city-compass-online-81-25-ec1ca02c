
-- Primeiro, vamos criar o tipo enum para o tipo de conteúdo caso não exista
DO $$ BEGIN
    CREATE TYPE tipo_conteudo_canal AS ENUM ('noticia', 'video', 'imagem', 'resultado_sorteio');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar tabela para armazenar os resultados dos sorteios
CREATE TABLE IF NOT EXISTS public.resultados_sorteio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  canal_informativo_id UUID REFERENCES public.canal_informativo(id) ON DELETE CASCADE NOT NULL,
  premios JSONB NOT NULL DEFAULT '[]'::jsonb,
  data_sorteio DATE NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.resultados_sorteio ENABLE ROW LEVEL SECURITY;

-- Política para admins gerenciarem resultados
CREATE POLICY "Admins podem gerenciar resultados de sorteio"
  ON public.resultados_sorteio
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND tipo_conta IN ('admin_geral', 'admin_cidade')
    )
  );

-- Política para todos verem resultados ativos
CREATE POLICY "Todos podem ver resultados de sorteio ativos"
  ON public.resultados_sorteio
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.canal_informativo ci
      WHERE ci.id = canal_informativo_id
      AND ci.ativo = true
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_resultados_sorteio_updated_at
  BEFORE UPDATE ON public.resultados_sorteio
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Atualizar a constraint da tabela canal_informativo para permitir o tipo 'resultado_sorteio'
ALTER TABLE public.canal_informativo 
DROP CONSTRAINT IF EXISTS canal_informativo_tipo_conteudo_check;

ALTER TABLE public.canal_informativo 
ADD CONSTRAINT canal_informativo_tipo_conteudo_check 
CHECK (tipo_conteudo IN ('noticia', 'video', 'imagem', 'resultado_sorteio'));

-- Recriar as funções RPC
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
