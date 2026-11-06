-- Saj Tem utiliza REST/PostgREST e Edge Functions, não o endpoint /graphql/v1.
-- pg_graphql expõe metadados de relações para anon/authenticated apesar de RLS.
-- RESTRICT faz a migração falhar se existir qualquer dependência externa.
-- Verificado previamente com BEGIN/DROP EXTENSION/ROLLBACK em 2026-11-06.
DROP EXTENSION IF EXISTS pg_graphql RESTRICT;
