-- Ensure the foreign key constraint exists and is properly named
ALTER TABLE public.avisos_sistema 
DROP CONSTRAINT IF EXISTS avisos_sistema_autor_id_fkey;

-- Add the foreign key constraint with proper naming
ALTER TABLE public.avisos_sistema 
ADD CONSTRAINT avisos_sistema_autor_id_fkey 
FOREIGN KEY (autor_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;