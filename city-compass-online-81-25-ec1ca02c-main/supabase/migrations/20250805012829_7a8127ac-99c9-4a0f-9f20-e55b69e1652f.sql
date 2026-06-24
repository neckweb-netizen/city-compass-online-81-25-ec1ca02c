-- Criar tabela para configurações do sistema
CREATE TABLE public.configuracoes_sistema (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL DEFAULT 'geral',
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configuração padrão do OneSignal
INSERT INTO public.configuracoes_sistema (chave, valor, descricao, categoria) VALUES 
('onesignal_app_id', 'c0534e3b-efa2-40bc-b6cd-bb13fd1cb774', 'App ID do OneSignal para notificações push', 'notificacoes'),
('onesignal_safari_web_id', 'web.onesignal.auto.665a394a-cbcf-449b-8277-1a86a5e1eeb9', 'Safari Web ID do OneSignal', 'notificacoes');

-- Habilitar RLS
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Admins podem gerenciar configurações" 
ON public.configuracoes_sistema 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.usuarios 
  WHERE id = auth.uid() 
  AND tipo_conta IN ('admin_geral', 'admin_cidade')
));

CREATE POLICY "Todos podem ver configurações ativas" 
ON public.configuracoes_sistema 
FOR SELECT 
USING (ativo = true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_configuracoes_sistema_updated_at
  BEFORE UPDATE ON public.configuracoes_sistema
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();