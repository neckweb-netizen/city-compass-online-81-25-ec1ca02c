
-- Criar enum para tipos de vagas
CREATE TYPE tipo_vaga AS ENUM ('clt', 'temporario', 'estagio', 'freelance');

-- Criar enum para status de aprovação de serviços
CREATE TYPE status_servico AS ENUM ('pendente', 'aprovado', 'rejeitado');

-- Tabela de categorias para vagas e serviços
CREATE TABLE categorias_oportunidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tipo TEXT NOT NULL CHECK (tipo IN ('vaga', 'servico')), -- Para diferenciar categorias de vagas e serviços
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de bairros (para filtros)
CREATE TABLE bairros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cidade_id UUID REFERENCES cidades(id) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de vagas de emprego (postadas pelo admin)
CREATE TABLE vagas_emprego (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    categoria_id UUID REFERENCES categorias_oportunidades(id) NOT NULL,
    bairro_id UUID REFERENCES bairros(id),
    cidade_id UUID REFERENCES cidades(id) NOT NULL,
    tipo_vaga tipo_vaga NOT NULL DEFAULT 'clt',
    requisitos TEXT,
    faixa_salarial TEXT,
    forma_candidatura TEXT NOT NULL, -- WhatsApp, email, link externo
    contato_candidatura TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    destaque BOOLEAN NOT NULL DEFAULT false,
    visualizacoes INTEGER NOT NULL DEFAULT 0,
    criado_por UUID REFERENCES usuarios(id) NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de serviços autônomos (enviados por usuários)
CREATE TABLE servicos_autonomos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_prestador TEXT NOT NULL,
    email_prestador TEXT NOT NULL,
    telefone_prestador TEXT,
    whatsapp_prestador TEXT,
    categoria_id UUID REFERENCES categorias_oportunidades(id) NOT NULL,
    descricao_servico TEXT NOT NULL,
    bairros_atendimento TEXT[] NOT NULL, -- Array de bairros que atende
    cidade_id UUID REFERENCES cidades(id) NOT NULL,
    foto_perfil_url TEXT,
    status_aprovacao status_servico NOT NULL DEFAULT 'pendente',
    observacoes_admin TEXT,
    aprovado_por UUID REFERENCES usuarios(id),
    data_aprovacao TIMESTAMP WITH TIME ZONE,
    visualizacoes INTEGER NOT NULL DEFAULT 0,
    usuario_id UUID REFERENCES usuarios(id), -- Se for um usuário logado
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categorias_oportunidades_updated_at BEFORE UPDATE ON categorias_oportunidades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vagas_emprego_updated_at BEFORE UPDATE ON vagas_emprego FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_servicos_autonomos_updated_at BEFORE UPDATE ON servicos_autonomos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir categorias padrão para vagas
INSERT INTO categorias_oportunidades (nome, slug, tipo) VALUES
('Vendas', 'vendas', 'vaga'),
('Limpeza', 'limpeza', 'vaga'),
('Administrativo', 'administrativo', 'vaga'),
('Saúde', 'saude', 'vaga'),
('Construção', 'construcao', 'vaga'),
('Educação', 'educacao', 'vaga'),
('Alimentação', 'alimentacao', 'vaga'),
('Tecnologia', 'tecnologia', 'vaga'),
('Segurança', 'seguranca', 'vaga'),
('Transporte', 'transporte', 'vaga');

-- Inserir categorias padrão para serviços
INSERT INTO categorias_oportunidades (nome, slug, tipo) VALUES
('Beleza e Estética', 'beleza-estetica', 'servico'),
('Eletricista', 'eletricista', 'servico'),
('Cuidadora', 'cuidadora', 'servico'),
('Editor de Vídeo', 'editor-video', 'servico'),
('Pedreiro', 'pedreiro', 'servico'),
('Manicure', 'manicure', 'servico'),
('Jardinagem', 'jardinagem', 'servico'),
('Limpeza Residencial', 'limpeza-residencial', 'servico'),
('Aulas Particulares', 'aulas-particulares', 'servico'),
('Mecânico', 'mecanico', 'servico'),
('Pintor', 'pintor', 'servico'),
('Encanador', 'encanador', 'servico');

-- Inserir bairros de exemplo (você pode ajustar conforme sua cidade)
INSERT INTO bairros (nome, cidade_id) VALUES
('Centro', '550e8400-e29b-41d4-a716-446655440000'),
('Bairro Novo', '550e8400-e29b-41d4-a716-446655440000'),
('Vila São José', '550e8400-e29b-41d4-a716-446655440000'),
('Jardim Europa', '550e8400-e29b-41d4-a716-446655440000'),
('Parque das Flores', '550e8400-e29b-41d4-a716-446655440000');

-- Políticas RLS
ALTER TABLE categorias_oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE bairros ENABLE ROW LEVEL SECURITY;
ALTER TABLE vagas_emprego ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos_autonomos ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias_oportunidades
CREATE POLICY "Todos podem ver categorias ativas" ON categorias_oportunidades
    FOR SELECT USING (ativo = true);

CREATE POLICY "Admins podem gerenciar categorias" ON categorias_oportunidades
    FOR ALL USING (user_has_permission());

-- Políticas para bairros
CREATE POLICY "Todos podem ver bairros ativos" ON bairros
    FOR SELECT USING (ativo = true);

CREATE POLICY "Admins podem gerenciar bairros" ON bairros
    FOR ALL USING (user_has_permission());

-- Políticas para vagas_emprego
CREATE POLICY "Todos podem ver vagas ativas" ON vagas_emprego
    FOR SELECT USING (ativo = true);

CREATE POLICY "Admins podem gerenciar vagas" ON vagas_emprego
    FOR ALL USING (user_has_permission());

-- Políticas para servicos_autonomos
CREATE POLICY "Todos podem ver serviços aprovados" ON servicos_autonomos
    FOR SELECT USING (status_aprovacao = 'aprovado');

CREATE POLICY "Usuários podem criar serviços" ON servicos_autonomos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins podem gerenciar todos os serviços" ON servicos_autonomos
    FOR ALL USING (user_has_permission());

CREATE POLICY "Usuários podem ver seus próprios serviços" ON servicos_autonomos
    FOR SELECT USING (usuario_id = auth.uid());

-- Função para incrementar visualizações
CREATE OR REPLACE FUNCTION incrementar_visualizacao_vaga(vaga_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE vagas_emprego 
    SET visualizacoes = visualizacoes + 1 
    WHERE id = vaga_id;
END;
$$;

CREATE OR REPLACE FUNCTION incrementar_visualizacao_servico(servico_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE servicos_autonomos 
    SET visualizacoes = visualizacoes + 1 
    WHERE id = servico_id;
END;
$$;
