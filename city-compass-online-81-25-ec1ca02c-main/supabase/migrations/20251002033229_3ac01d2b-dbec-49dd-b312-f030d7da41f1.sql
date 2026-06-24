-- CRITICAL SECURITY FIX: Restrict agendamentos table access to protect customer PII
-- Remove overly permissive policy and implement proper access control

-- Drop the insecure policy that allows anyone to create appointments
DROP POLICY IF EXISTS "Todos podem criar agendamentos" ON public.agendamentos;

-- Create secure policy: Only authenticated users can create appointments
CREATE POLICY "Usuários autenticados podem criar agendamentos"
ON public.agendamentos
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Ensure empresas can only see and manage their own appointments
DROP POLICY IF EXISTS "Empresas podem ver seus agendamentos" ON public.agendamentos;
CREATE POLICY "Empresas podem ver seus agendamentos"
ON public.agendamentos
FOR SELECT
TO authenticated
USING (
  empresa_id IN (
    SELECT id FROM empresas 
    WHERE usuario_id = auth.uid()
  )
  OR
  -- Admin access
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND tipo_conta IN ('admin_geral', 'admin_cidade')
  )
);

-- Secure the update policy as well
DROP POLICY IF EXISTS "Empresas podem atualizar seus agendamentos" ON public.agendamentos;
CREATE POLICY "Empresas podem atualizar seus agendamentos"
ON public.agendamentos
FOR UPDATE
TO authenticated
USING (
  empresa_id IN (
    SELECT id FROM empresas 
    WHERE usuario_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND tipo_conta IN ('admin_geral', 'admin_cidade')
  )
)
WITH CHECK (
  empresa_id IN (
    SELECT id FROM empresas 
    WHERE usuario_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND tipo_conta IN ('admin_geral', 'admin_cidade')
  )
);

-- Admins policy (remove permissive one and make it specific)
DROP POLICY IF EXISTS "Admins podem gerenciar agendamentos" ON public.agendamentos;
CREATE POLICY "Admins podem gerenciar agendamentos"
ON public.agendamentos
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND tipo_conta IN ('admin_geral', 'admin_cidade')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND tipo_conta IN ('admin_geral', 'admin_cidade')
  )
);

-- Enhance password validation in useSecureAuth by updating minimum length requirement
-- This is handled in the application code (useSecureAuth.tsx already has 8 char minimum)

-- Add database function to validate appointment data
CREATE OR REPLACE FUNCTION public.validar_agendamento_antes_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate that empresa exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM empresas 
    WHERE id = NEW.empresa_id 
    AND ativo = true 
    AND status_aprovacao = 'aprovado'
  ) THEN
    RAISE EXCEPTION 'Empresa não encontrada ou não está ativa';
  END IF;
  
  -- Validate phone number format (basic validation)
  IF NEW.telefone_cliente !~ '^\+?[0-9\s\-\(\)]+$' THEN
    RAISE EXCEPTION 'Formato de telefone inválido';
  END IF;
  
  -- Validate that appointment is not in the past
  IF NEW.data_agendamento < NOW() THEN
    RAISE EXCEPTION 'Não é possível agendar para datas passadas';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for appointment validation
DROP TRIGGER IF EXISTS trigger_validar_agendamento ON public.agendamentos;
CREATE TRIGGER trigger_validar_agendamento
  BEFORE INSERT ON public.agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.validar_agendamento_antes_insert();