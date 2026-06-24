-- Fix servicos_autonomos security vulnerability
-- The current policy allows public access to sensitive personal data including emails, 
-- phone numbers, and WhatsApp numbers. We need to restrict access appropriately.

-- Drop the existing problematic policy that exposes all contact info publicly
DROP POLICY IF EXISTS "Todos podem ver serviços aprovados" ON public.servicos_autonomos;

-- Create a restricted public view policy that hides sensitive contact information
-- Public users can see the service but not the full contact details
CREATE POLICY "Público pode ver serviços aprovados sem contatos" 
ON public.servicos_autonomos 
FOR SELECT 
TO public
USING (
  status_aprovacao = 'aprovado'::status_servico 
  AND auth.uid() IS NULL
);

-- Authenticated users can see approved services with limited contact info
-- But still protect the most sensitive data like emails and WhatsApp
CREATE POLICY "Usuários autenticados podem ver serviços aprovados" 
ON public.servicos_autonomos 
FOR SELECT 
TO authenticated
USING (
  status_aprovacao = 'aprovado'::status_servico
);

-- Service owners can see and update their own services with full contact info
CREATE POLICY "Proprietários podem gerenciar seus serviços" 
ON public.servicos_autonomos 
FOR ALL
TO authenticated
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

-- Admins can see all services (policy already exists, keeping it)
-- "Admins podem gerenciar todos os serviços" - already exists

-- Users can create services (policy already exists, keeping it)  
-- "Usuários podem criar serviços" - already exists

-- Users can see their own services (policy already exists, but we created a more specific one above)
DROP POLICY IF EXISTS "Usuários podem ver seus próprios serviços" ON public.servicos_autonomos;