-- Corrigir associação da empresa "Eluz Matérias Elétricos" com o usuário Deivid
UPDATE empresas 
SET usuario_id = '0383df69-cf52-4632-b09f-8d6dd6e932b0'
WHERE id = 'd459d1e8-c832-4b84-8761-c0b5d957356a' 
AND nome = 'Eluz Matérias Elétricos';