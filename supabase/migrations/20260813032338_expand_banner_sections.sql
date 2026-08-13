-- Mantém o enum do banco alinhado às seções disponíveis no painel administrativo.
ALTER TYPE public.tipo_secao_banner ADD VALUE IF NOT EXISTS 'canal_video';
ALTER TYPE public.tipo_secao_banner ADD VALUE IF NOT EXISTS 'domino';
ALTER TYPE public.tipo_secao_banner ADD VALUE IF NOT EXISTS 'ferramentas';
ALTER TYPE public.tipo_secao_banner ADD VALUE IF NOT EXISTS 'gerador_rifa';
ALTER TYPE public.tipo_secao_banner ADD VALUE IF NOT EXISTS 'gerador_cobranca';
ALTER TYPE public.tipo_secao_banner ADD VALUE IF NOT EXISTS 'criador_curriculo';
ALTER TYPE public.tipo_secao_banner ADD VALUE IF NOT EXISTS 'gestao_cobrancas';
ALTER TYPE public.tipo_secao_banner ADD VALUE IF NOT EXISTS 'calculadora_orcamento';
ALTER TYPE public.tipo_secao_banner ADD VALUE IF NOT EXISTS 'calculadora_margem';
ALTER TYPE public.tipo_secao_banner ADD VALUE IF NOT EXISTS 'simulador_rescisao';
ALTER TYPE public.tipo_secao_banner ADD VALUE IF NOT EXISTS 'leitor_voz';

-- Permite banners de código sem exigir uma imagem e alinha os tipos aceitos pelo painel.
ALTER TABLE public.banners_publicitarios
  ADD COLUMN IF NOT EXISTS codigo_html text;

ALTER TABLE public.banners_publicitarios
  ALTER COLUMN imagem_url DROP NOT NULL;

ALTER TABLE public.banners_publicitarios
  DROP CONSTRAINT IF EXISTS banners_publicitarios_tipo_midia_check;

ALTER TABLE public.banners_publicitarios
  ADD CONSTRAINT banners_publicitarios_tipo_midia_check
  CHECK (tipo_midia IN ('imagem', 'video', 'codigo'));

-- O painel aceita ordens de 1 a 999.
ALTER TABLE public.banners_publicitarios
  DROP CONSTRAINT IF EXISTS banners_publicitarios_ordem_check;

ALTER TABLE public.banners_publicitarios
  ADD CONSTRAINT banners_publicitarios_ordem_check
  CHECK (ordem BETWEEN 1 AND 999);
