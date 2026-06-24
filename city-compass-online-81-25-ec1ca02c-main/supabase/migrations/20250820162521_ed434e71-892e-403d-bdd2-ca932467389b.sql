-- Passo 2: Proteger extensão pg_net no schema public
-- Como pg_net não pode ser movida, vamos bloquear o acesso público

-- 2.1 Descobrir schema atual do pg_net e proteger adequadamente
DO $$
DECLARE 
    ext_schema text;
    schema_exists boolean;
BEGIN
    -- Encontrar schema atual da extensão pg_net
    SELECT n.nspname INTO ext_schema
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'pg_net';
    
    -- Se pg_net está no public e existe schema 'net', usar 'net'
    IF ext_schema = 'public' THEN
        SELECT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname = 'net') INTO schema_exists;
        IF schema_exists THEN
            ext_schema := 'net';
        END IF;
    END IF;
    
    -- Revogar acesso público ao schema e funções
    EXECUTE format('REVOKE USAGE ON SCHEMA %I FROM PUBLIC;', ext_schema);
    EXECUTE format('REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA %I FROM PUBLIC;', ext_schema);
    
    -- Conceder apenas aos papéis necessários
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO service_role;', ext_schema);
    EXECUTE format('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA %I TO service_role;', ext_schema);
    
    -- Definir defaults para objetos futuros
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;', ext_schema);
    EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT EXECUTE ON FUNCTIONS TO service_role;', ext_schema);
    
    RAISE NOTICE 'Proteção aplicada ao schema % para pg_net', ext_schema;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao proteger pg_net: %', SQLERRM;
END $$;

-- 2.2 Criar schema extensions para futuras extensões
CREATE SCHEMA IF NOT EXISTS extensions;
REVOKE ALL ON SCHEMA extensions FROM public;
GRANT USAGE ON SCHEMA extensions TO service_role;