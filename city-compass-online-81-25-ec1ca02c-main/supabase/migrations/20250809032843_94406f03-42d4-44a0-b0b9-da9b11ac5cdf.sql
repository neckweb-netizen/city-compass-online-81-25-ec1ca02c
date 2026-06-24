-- Adicionar campos de link de compra e WhatsApp na tabela produtos
ALTER TABLE public.produtos 
ADD COLUMN link_compra text,
ADD COLUMN link_whatsapp text;