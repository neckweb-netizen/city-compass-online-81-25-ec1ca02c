
-- Adicionar novo tipo de conteúdo para resultados de sorteio
ALTER TYPE tipo_conteudo_canal ADD VALUE IF NOT EXISTS 'resultado_sorteio';

-- Criar tabela para armazenar os resultados dos sorteios
CREATE TABLE public.resultados_sorteio (
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
