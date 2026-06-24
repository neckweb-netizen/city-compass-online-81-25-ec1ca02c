-- Adicionar campo de data de vencimento do plano nas empresas
ALTER TABLE public.empresas 
ADD COLUMN plano_data_vencimento TIMESTAMP WITH TIME ZONE;