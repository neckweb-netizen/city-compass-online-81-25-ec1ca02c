-- Adicionar campos de configuração de agendamentos na tabela empresas
ALTER TABLE public.empresas 
ADD COLUMN agendamentos_ativo BOOLEAN DEFAULT false,
ADD COLUMN servicos_agendamento TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Criar tabela para configurações detalhadas de serviços de agendamento
CREATE TABLE public.servicos_agendamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  nome_servico TEXT NOT NULL,
  descricao TEXT,
  duracao_minutos INTEGER NOT NULL DEFAULT 60,
  preco DECIMAL(10,2),
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.servicos_agendamento ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para servicos_agendamento
CREATE POLICY "Empresas podem gerenciar seus serviços" 
ON public.servicos_agendamento 
FOR ALL 
USING (
  empresa_id IN (
    SELECT id FROM empresas WHERE usuario_id = auth.uid()
  ) OR user_has_permission()
);

CREATE POLICY "Todos podem ver serviços de empresas ativas" 
ON public.servicos_agendamento 
FOR SELECT 
USING (
  ativo = true AND 
  EXISTS (
    SELECT 1 FROM empresas e 
    WHERE e.id = servicos_agendamento.empresa_id 
    AND e.ativo = true 
    AND e.status_aprovacao = 'aprovado'
  )
);

-- Trigger para atualizar timestamp
CREATE TRIGGER update_servicos_agendamento_updated_at
BEFORE UPDATE ON public.servicos_agendamento
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();