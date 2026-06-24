-- Criar tabela para lugares públicos
CREATE TABLE public.lugares_publicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  endereco TEXT,
  tipo TEXT NOT NULL, -- 'praca', 'biblioteca', 'cinema', 'parque', etc
  imagem_url TEXT,
  telefone TEXT,
  horario_funcionamento JSONB,
  localizacao POINT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  destaque BOOLEAN NOT NULL DEFAULT false,
  cidade_id UUID NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lugares_publicos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Todos podem ver lugares ativos" 
ON public.lugares_publicos 
FOR SELECT 
USING (ativo = true);

CREATE POLICY "Admins podem gerenciar lugares" 
ON public.lugares_publicos 
FOR ALL 
USING (user_has_permission());

-- Trigger para atualizar timestamp
CREATE TRIGGER update_lugares_publicos_updated_at
BEFORE UPDATE ON public.lugares_publicos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir alguns lugares exemplo de Santo Antônio de Jesus
INSERT INTO public.lugares_publicos (nome, descricao, tipo, endereco, cidade_id, destaque) VALUES
('Praça da Purificação', 'Praça central da cidade com igreja histórica', 'praca', 'Centro, Santo Antônio de Jesus - BA', '550e8400-e29b-41d4-a716-446655440000', true),
('Terminal Rodoviário', 'Terminal de ônibus da cidade', 'terminal', 'Av. Getúlio Vargas, Santo Antônio de Jesus - BA', '550e8400-e29b-41d4-a716-446655440000', false),
('Estação Ferroviária', 'Estação histórica de trem', 'estacao', 'Centro, Santo Antônio de Jesus - BA', '550e8400-e29b-41d4-a716-446655440000', false),
('Casa da Cultura', 'Centro cultural da cidade', 'cultura', 'Centro, Santo Antônio de Jesus - BA', '550e8400-e29b-41d4-a716-446655440000', true),
('Parque da Cidade', 'Área de lazer e recreação', 'parque', 'Santo Antônio de Jesus - BA', '550e8400-e29b-41d4-a716-446655440000', true),
('Biblioteca Municipal', 'Biblioteca pública da cidade', 'biblioteca', 'Centro, Santo Antônio de Jesus - BA', '550e8400-e29b-41d4-a716-446655440000', false);