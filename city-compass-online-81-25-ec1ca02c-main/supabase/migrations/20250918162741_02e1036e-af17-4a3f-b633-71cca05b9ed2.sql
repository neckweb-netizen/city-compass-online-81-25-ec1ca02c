-- Função para limpar URLs do Google removendo parâmetros problemáticos
CREATE OR REPLACE FUNCTION limpar_urls_google() RETURNS void AS $$
DECLARE
    empresa_record RECORD;
    url_limpa TEXT;
BEGIN
    -- Percorrer todas as empresas com URLs do Google
    FOR empresa_record IN 
        SELECT id, imagem_capa_url 
        FROM empresas 
        WHERE imagem_capa_url LIKE '%googleusercontent.com%'
        AND imagem_capa_url LIKE '%=%'
    LOOP
        -- Extrair a URL limpa (tudo antes do primeiro parâmetro =)
        url_limpa := split_part(empresa_record.imagem_capa_url, '=', 1);
        
        -- Atualizar apenas se a URL mudou
        IF url_limpa != empresa_record.imagem_capa_url THEN
            UPDATE empresas 
            SET imagem_capa_url = url_limpa,
                atualizado_em = now()
            WHERE id = empresa_record.id;
            
            RAISE NOTICE 'URL limpa para empresa %: % -> %', 
                empresa_record.id, empresa_record.imagem_capa_url, url_limpa;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar a limpeza das URLs existentes
SELECT limpar_urls_google();