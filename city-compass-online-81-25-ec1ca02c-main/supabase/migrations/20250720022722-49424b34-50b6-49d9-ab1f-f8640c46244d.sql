
-- Criar tabela para avisos do sistema
CREATE TABLE public.avisos_sistema (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  tipo_aviso TEXT NOT NULL CHECK (tipo_aviso IN ('info', 'warning', 'success', 'error', 'update')) DEFAULT 'info',
  botoes JSONB DEFAULT '[]'::jsonb, -- Array de objetos {texto: string, link: string, cor: string}
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_inicio TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_fim TIMESTAMP WITH TIME ZONE,
  prioridade INTEGER DEFAULT 0, -- Para ordenação
  autor_id UUID REFERENCES auth.users(id) NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.avisos_sistema ENABLE ROW LEVEL SECURITY;

-- Política para todos verem avisos ativos
CREATE POLICY "Todos podem ver avisos ativos"
  ON public.avisos_sistema
  FOR SELECT
  USING (
    ativo = true 
    AND (data_inicio IS NULL OR data_inicio <= now())
    AND (data_fim IS NULL OR data_fim >= now())
  );

-- Política para admins gerenciarem avisos
CREATE POLICY "Admins podem gerenciar avisos"
  ON public.avisos_sistema
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND tipo_conta IN ('admin_geral', 'admin_cidade')
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_avisos_sistema_updated_at
  BEFORE UPDATE ON public.avisos_sistema
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
