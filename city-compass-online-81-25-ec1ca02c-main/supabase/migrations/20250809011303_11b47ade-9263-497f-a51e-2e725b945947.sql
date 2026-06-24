-- Atualizar empresas criadas por admins para ficarem sem proprietário
UPDATE empresas 
SET usuario_id = NULL 
WHERE usuario_id IN (
  SELECT id FROM usuarios 
  WHERE tipo_conta IN ('admin_geral', 'admin_cidade')
) AND usuario_id IS NOT NULL;