-- Criar uma empresa de teste sem proprietário para verificar o aviso
INSERT INTO public.empresas (
  nome,
  slug,
  descricao,
  endereco,
  telefone,
  cidade_id,
  categoria_id,
  usuario_id,
  status_aprovacao,
  ativo,
  destaque,
  verificado
) VALUES (
  'Empresa Teste Sem Proprietário',
  'empresa-teste-sem-proprietario',
  'Empresa criada pelo admin para teste do aviso',
  'Rua de Teste, 123',
  '75999999999',
  '550e8400-e29b-41d4-a716-446655440000', -- Santo Antônio de Jesus
  '8539c0a9-5a00-448c-bcbe-4393dadf3810', -- Comércio
  NULL, -- SEM PROPRIETÁRIO
  'aprovado',
  true,
  false,
  true
);