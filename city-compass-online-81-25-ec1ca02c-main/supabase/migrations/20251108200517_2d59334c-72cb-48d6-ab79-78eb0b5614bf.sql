-- Adicionar campo de status de aprovação para reclamações
ALTER TABLE problemas_cidade 
ADD COLUMN IF NOT EXISTS status_aprovacao status_aprovacao DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS aprovado_por uuid REFERENCES usuarios(id),
ADD COLUMN IF NOT EXISTS data_aprovacao timestamp with time zone;

-- Atualizar reclamações existentes para aprovadas
UPDATE problemas_cidade SET status_aprovacao = 'aprovado' WHERE ativo = true;

-- Adicionar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_problemas_status_aprovacao ON problemas_cidade(status_aprovacao);

-- Comentários
COMMENT ON COLUMN problemas_cidade.status_aprovacao IS 'Status de aprovação da reclamação';
COMMENT ON COLUMN problemas_cidade.aprovado_por IS 'ID do admin que aprovou';
COMMENT ON COLUMN problemas_cidade.data_aprovacao IS 'Data e hora da aprovação';