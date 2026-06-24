-- Criar tabela para configurações de ordem das seções da página inicial
CREATE TABLE public.home_sections_order (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configurações padrão das seções
INSERT INTO public.home_sections_order (section_name, display_name, ordem, ativo) VALUES
  ('banner', 'Banner Principal', 1, true),
  ('search', 'Barra de Busca', 2, true),
  ('stories', 'Stories', 3, true),
  ('categories', 'Categorias', 4, true),
  ('latest_job_coupons', 'Últimas Vagas de Emprego', 5, true),
  ('latest_coupons', 'Últimos Cupons', 6, true),
  ('canal_informativo', 'Canal Informativo', 7, true),
  ('popular_businesses', 'Empresas Populares', 8, true),
  ('featured_section', 'Seção em Destaque', 9, true),
  ('eventos_slider', 'Slider de Eventos', 10, true),
  ('stats_section', 'Estatísticas', 11, true);

-- Habilitar RLS
ALTER TABLE public.home_sections_order ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Admins podem gerenciar ordem das seções" 
ON public.home_sections_order 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND tipo_conta IN ('admin_geral', 'admin_cidade')
  )
);

CREATE POLICY "Todos podem ver configurações ativas" 
ON public.home_sections_order 
FOR SELECT 
USING (ativo = true);

-- Criar trigger para atualizar timestamp
CREATE TRIGGER update_home_sections_order_updated_at
  BEFORE UPDATE ON public.home_sections_order
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();