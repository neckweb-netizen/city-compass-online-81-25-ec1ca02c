
-- Criar tabela para notificações do sistema
CREATE TABLE public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('aviso', 'avaliacao', 'cupom', 'evento', 'sistema')) DEFAULT 'sistema',
  lida BOOLEAN NOT NULL DEFAULT false,
  criada_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referencia_id TEXT,
  referencia_tipo TEXT
);

-- Habilitar RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem suas próprias notificações
CREATE POLICY "Usuários podem ver suas notificações"
  ON public.notificacoes
  FOR SELECT
  USING (usuario_id = auth.uid());

-- Política para usuários marcarem suas notificações como lidas
CREATE POLICY "Usuários podem marcar suas notificações como lidas"
  ON public.notificacoes
  FOR UPDATE
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- Política para admins criarem notificações
CREATE POLICY "Admins podem criar notificações"
  ON public.notificacoes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND tipo_conta IN ('admin_geral', 'admin_cidade')
    )
  );

-- Política para sistema criar notificações automaticamente
CREATE POLICY "Sistema pode criar notificações"
  ON public.notificacoes
  FOR INSERT
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_notificacoes_usuario_id ON public.notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_criada_em ON public.notificacoes(criada_em);
CREATE INDEX idx_notificacoes_lida ON public.notificacoes(lida);
