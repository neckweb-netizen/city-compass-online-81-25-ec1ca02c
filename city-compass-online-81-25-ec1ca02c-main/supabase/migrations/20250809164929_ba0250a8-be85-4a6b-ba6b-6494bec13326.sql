-- Criar tabela para múltiplos endereços de empresas
CREATE TABLE public.enderecos_empresa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL,
  nome_identificacao TEXT NOT NULL, -- Ex: "Matriz", "Filial Centro", "Filial Shopping"
  endereco TEXT NOT NULL,
  bairro TEXT,
  cep TEXT,
  cidade_id UUID NOT NULL,
  localizacao POINT,
  telefone TEXT,
  horario_funcionamento JSONB,
  principal BOOLEAN NOT NULL DEFAULT false, -- Indica se é o endereço principal
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.enderecos_empresa ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
CREATE POLICY "Todos podem ver endereços de empresas ativas" 
ON public.enderecos_empresa 
FOR SELECT 
USING (
  ativo = true AND 
  EXISTS (
    SELECT 1 FROM public.empresas e 
    WHERE e.id = enderecos_empresa.empresa_id 
    AND e.ativo = true 
    AND e.status_aprovacao = 'aprovado'
  )
);

CREATE POLICY "Empresas podem gerenciar seus endereços" 
ON public.enderecos_empresa 
FOR ALL 
USING (
  empresa_id IN (
    SELECT id FROM public.empresas 
    WHERE usuario_id = auth.uid()
  ) OR user_has_permission()
);

-- Criar trigger para atualizar timestamp
CREATE TRIGGER update_enderecos_empresa_updated_at
BEFORE UPDATE ON public.enderecos_empresa
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX idx_enderecos_empresa_empresa_id ON public.enderecos_empresa(empresa_id);
CREATE INDEX idx_enderecos_empresa_cidade_id ON public.enderecos_empresa(cidade_id);
CREATE INDEX idx_enderecos_empresa_principal ON public.enderecos_empresa(principal) WHERE principal = true;