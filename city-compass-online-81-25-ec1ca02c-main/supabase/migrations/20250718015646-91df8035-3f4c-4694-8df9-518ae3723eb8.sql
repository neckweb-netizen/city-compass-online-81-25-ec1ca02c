
-- Primeiro, vamos verificar se o usuário existe na tabela usuarios
SELECT id, nome, email, tipo_conta, cidade_id 
FROM usuarios 
WHERE email = 'neckweb@gmail.com';

-- Se não existir, vamos criar o registro
-- Substitua 'USER_ID_FROM_AUTH' pelo ID real do usuário da tabela auth.users
-- Você pode encontrar o ID nos logs do console: "22f895ff-ac6a-405a-8087-aaf50997cfb4"
INSERT INTO usuarios (id, nome, email, tipo_conta, cidade_id)
VALUES (
  '22f895ff-ac6a-405a-8087-aaf50997cfb4',
  'Admin Geral',
  'neckweb@gmail.com',
  'admin_geral',
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  email = EXCLUDED.email,
  tipo_conta = EXCLUDED.tipo_conta;

-- Verificar se o insert/update funcionou
SELECT id, nome, email, tipo_conta, cidade_id 
FROM usuarios 
WHERE email = 'neckweb@gmail.com';
