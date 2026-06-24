
-- Criar tabela para configurações de menu
CREATE TABLE public.menu_configuracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_item TEXT NOT NULL,
  rota TEXT NOT NULL,
  icone TEXT NOT NULL,
  posicao_desktop TEXT NOT NULL DEFAULT 'sidebar' CHECK (posicao_desktop IN ('sidebar', 'bottom')),
  posicao_mobile TEXT NOT NULL DEFAULT 'hamburger' CHECK (posicao_mobile IN ('hamburger', 'bottom')),
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  apenas_admin BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.menu_configuracoes ENABLE ROW LEVEL SECURITY;

-- Política para admins gerenciarem configurações de menu
CREATE POLICY "Admins podem gerenciar configurações de menu"
  ON public.menu_configuracoes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND tipo_conta IN ('admin_geral', 'admin_cidade')
    )
  );

-- Política para todos verem configurações ativas
CREATE POLICY "Todos podem ver configurações ativas de menu"
  ON public.menu_configuracoes
  FOR SELECT
  USING (ativo = true);

-- Inserir configurações padrão de menu
INSERT INTO public.menu_configuracoes (nome_item, rota, icone, posicao_desktop, posicao_mobile, ordem, apenas_admin) VALUES
('Home', '/?tab=home', 'Home', 'bottom', 'bottom', 1, false),
('Buscar', '/?tab=search', 'Search', 'bottom', 'bottom', 2, false),
('Categorias', '/?tab=categories', 'Grid3X3', 'bottom', 'bottom', 3, false),
('Cupons', '/?tab=coupons', 'Ticket', 'bottom', 'bottom', 4, false),
('Perfil', '/?tab=profile', 'User', 'bottom', 'bottom', 5, false),
('Canal Informativo', '/canal-informativo', 'MessageSquare', 'sidebar', 'hamburger', 6, false),
('Empresa Dashboard', '/empresa-dashboard', 'Building2', 'sidebar', 'hamburger', 7, false),
('Admin Dashboard', '/admin', 'Shield', 'sidebar', 'hamburger', 8, true);

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_menu_configuracoes_updated_at
  BEFORE UPDATE ON public.menu_configuracoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
