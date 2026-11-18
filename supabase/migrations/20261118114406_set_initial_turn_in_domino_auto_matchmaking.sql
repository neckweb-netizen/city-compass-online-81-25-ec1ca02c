-- Already applied to Supabase production as migration 20261118114406.
-- Starting a match through the automatic queue must assign the first turn.
-- Keep existing room selection and locking unchanged.
DO $migration$
DECLARE
 v_def text := pg_get_functiondef('public.processar_fila_domino()'::regprocedure);
 v_new text;
 v_first text := 'status = CASE WHEN v_j2 IS NOT NULL THEN '||chr(39)||'jogando'||chr(39)||'::text ELSE '||chr(39)||'aguardando'||chr(39)||'::text END,';
 v_second text := 'status = '||chr(39)||'jogando'||chr(39)||',';
BEGIN
 IF (length(v_def)-length(replace(v_def,v_first,'')))/length(v_first) <> 1 THEN
   RAISE EXCEPTION 'Unexpected first branch in automatic queue';
 END IF;
 IF (length(v_def)-length(replace(v_def,v_second,'')))/length(v_second) <> 1 THEN
   RAISE EXCEPTION 'Unexpected second branch in automatic queue';
 END IF;
 v_new := replace(v_def,v_first,v_first|| E'\n'||'                                                                                                            vez_usuario_id = CASE WHEN v_j2 IS NOT NULL THEN v_j2 ELSE null END,');
 v_new := replace(v_new,v_second,v_second|| E'\n'||'                                                                                                                  vez_usuario_id = v_j1,');
 EXECUTE v_new;
END
$migration$;
