
-- Add foreign key constraint between avisos_sistema and usuarios tables
ALTER TABLE public.avisos_sistema 
ADD CONSTRAINT avisos_sistema_autor_id_fkey 
FOREIGN KEY (autor_id) REFERENCES public.usuarios(id);
