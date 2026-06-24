-- Criar tabela de agendamentos
CREATE TABLE public.agendamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  nome_cliente TEXT NOT NULL,
  telefone_cliente TEXT NOT NULL,
  servico TEXT NOT NULL,
  data_agendamento TIMESTAMP WITH TIME ZONE NOT NULL,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Empresas podem ver seus agendamentos" 
ON public.agendamentos 
FOR SELECT 
USING (empresa_id IN (
  SELECT id FROM empresas WHERE usuario_id = auth.uid()
));

CREATE POLICY "Empresas podem atualizar seus agendamentos" 
ON public.agendamentos 
FOR UPDATE 
USING (empresa_id IN (
  SELECT id FROM empresas WHERE usuario_id = auth.uid()
));

CREATE POLICY "Todos podem criar agendamentos" 
ON public.agendamentos 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins podem gerenciar agendamentos" 
ON public.agendamentos 
FOR ALL 
USING (user_has_permission());

-- Trigger para atualizar timestamp
CREATE TRIGGER update_agendamentos_updated_at
BEFORE UPDATE ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();