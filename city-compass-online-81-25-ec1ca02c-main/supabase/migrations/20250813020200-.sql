-- Create short_urls table for URL shortening system
CREATE TABLE public.short_urls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_code TEXT NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.short_urls ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can create short URLs" 
ON public.short_urls 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can read short URLs" 
ON public.short_urls 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own short URLs" 
ON public.short_urls 
FOR UPDATE 
USING (auth.uid() = created_by OR created_by IS NULL);

-- Create function to generate unique short codes
CREATE OR REPLACE FUNCTION public.generate_short_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM public.short_urls WHERE short_code = result) INTO code_exists;
    
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN result;
END;
$$;

-- Create function to increment click count
CREATE OR REPLACE FUNCTION public.increment_url_clicks(code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  original_url_result TEXT;
BEGIN
  UPDATE public.short_urls 
  SET clicks = clicks + 1, updated_at = now()
  WHERE short_code = code 
    AND (expires_at IS NULL OR expires_at > now())
  RETURNING original_url INTO original_url_result;
  
  RETURN original_url_result;
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_short_urls_updated_at
  BEFORE UPDATE ON public.short_urls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_short_urls_code ON public.short_urls(short_code);
CREATE INDEX idx_short_urls_created_by ON public.short_urls(created_by);
CREATE INDEX idx_short_urls_created_at ON public.short_urls(created_at);