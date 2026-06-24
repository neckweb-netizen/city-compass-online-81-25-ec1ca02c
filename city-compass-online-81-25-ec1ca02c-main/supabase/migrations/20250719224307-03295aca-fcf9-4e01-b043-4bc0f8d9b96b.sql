
-- Criar tabela para o canal informativo
CREATE TABLE public.canal_informativo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  tipo_conteudo TEXT NOT NULL CHECK (tipo_conteudo IN ('noticia', 'video', 'imagem')),
  url_midia TEXT,
  link_externo TEXT,
  autor_id UUID REFERENCES auth.users(id) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.canal_informativo ENABLE ROW LEVEL SECURITY;

-- Política para todos verem conteúdo ativo
CREATE POLICY "Todos podem ver conteúdo ativo do canal"
  ON public.canal_informativo
  FOR SELECT
  USING (ativo = true);

-- Política para admins gerenciarem o canal
CREATE POLICY "Admins podem gerenciar canal informativo"
  ON public.canal_informativo
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND tipo_conta IN ('admin_geral', 'admin_cidade')
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_canal_informativo_updated_at
  BEFORE UPDATE ON public.canal_informativo
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
