
-- Create security logs table for monitoring security events
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on security logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for security logs (only admins can view)
CREATE POLICY "Admins podem ver logs de segurança" 
ON public.security_logs 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() 
        AND tipo_conta IN ('admin_geral', 'admin_cidade')
    )
);

-- Create index for better performance on security logs
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at DESC);

-- Create rate limiting table for tracking API usage
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL, -- IP address or user ID
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create unique constraint for rate limiting
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_identifier_endpoint 
ON public.rate_limits(identifier, endpoint, window_start);

-- Create function to clean old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete records older than 1 hour
    DELETE FROM public.rate_limits 
    WHERE window_start < now() - interval '1 hour';
END;
$$;

-- Create session tracking table for enhanced security
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user sessions (users can only see their own)
CREATE POLICY "Usuários podem ver próprias sessões" 
ON public.user_sessions 
FOR SELECT 
USING (user_id = auth.uid());

-- Create policy for admins to view all sessions
CREATE POLICY "Admins podem ver todas as sessões" 
ON public.user_sessions 
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() 
        AND tipo_conta IN ('admin_geral', 'admin_cidade')
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- Create function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Mark expired sessions as inactive
    UPDATE public.user_sessions 
    SET is_active = false 
    WHERE expires_at < now() AND is_active = true;
    
    -- Delete very old inactive sessions (older than 30 days)
    DELETE FROM public.user_sessions 
    WHERE is_active = false 
    AND created_at < now() - interval '30 days';
END;
$$;

-- Add trigger to update updated_at on rate_limits table
CREATE OR REPLACE FUNCTION public.update_rate_limits_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_rate_limits_updated_at ON public.rate_limits;
CREATE TRIGGER trigger_update_rate_limits_updated_at
    BEFORE UPDATE ON public.rate_limits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_rate_limits_updated_at();

-- Create comprehensive security monitoring view
CREATE OR REPLACE VIEW public.security_dashboard AS
SELECT 
    DATE_TRUNC('day', sl.created_at) as date,
    sl.event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT sl.user_id) as unique_users,
    COUNT(DISTINCT sl.ip_address) as unique_ips
FROM public.security_logs sl
WHERE sl.created_at >= now() - interval '30 days'
GROUP BY DATE_TRUNC('day', sl.created_at), sl.event_type
ORDER BY date DESC, event_count DESC;
