
-- Atualizar a constraint para permitir o tipo 'resultado_sorteio'
ALTER TABLE public.canal_informativo 
DROP CONSTRAINT IF EXISTS canal_informativo_tipo_conteudo_check;

ALTER TABLE public.canal_informativo 
ADD CONSTRAINT canal_informativo_tipo_conteudo_check 
CHECK (tipo_conteudo IN ('noticia', 'video', 'imagem', 'resultado_sorteio'));
