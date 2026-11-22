# SAJ TEM — inventário de backup e divergência de perfis

**Situação verificada em 21/11/2026:** a auditoria SOMENTE LEITURA do Supabase identificou 10 contas em `auth.users`, 3 perfis em `public.usuarios`, 7 contas antigas com login anterior sem perfil, 0 perfis órfãos e 0 empresas sem proprietário. O gatilho `on_auth_user_created` existe e está associado a `public.handle_new_user()`.

Esses resultados NÃO autorizam recriar, apagar, alterar permissões ou vincular contas automaticamente. A origem da divergência histórica ainda não foi determinada; papéis anteriores podem não ser recuperáveis sem um backup. O frontend tenta criar perfis ausentes, mas a política atual não disponibiliza inserção direta na tabela `usuarios` para usuários autenticados. Validar cada caso com proprietário e backup antes de implementar recuperação.

## Auditoria reproduzível e sem dados pessoais

Execute as consultas **somente leitura** do arquivo `scripts/sql/auth-profile-integrity.sql` no SQL Editor autorizado. Compare contagens com a data anterior. Nunca publicar exportações de `auth.users`, emails, segredos, hashes ou IDs no GitHub ou neste chat.

## Preparação de um backup externo, em computador autorizado

1. Consultar a documentação atual do Supabase CLI e a disponibilidade de backups no plano. Em ambiente local privado, usar `supabase db dump --help` para configurar a exportação SQL. Conferir explicitamente a cobertura de esquemas `public`, `auth`, migrações, políticas RLS, funções, gatilhos e roles. A opção padrão de dump pode não incluir todo `auth` ou `storage`.
2. Exportar e inventariar separadamente os **objetos físicos** de Supabase Storage e Cloudflare R2. SQL do banco, sem objetos físicos, não é backup completo de imagens/arquivos.
3. Guardar configurações de autenticação, provedores, políticas e instruções de reimplantação de Edge Functions em cofre separado; não salvar tokens em texto puro.
4. Manter os arquivos em pasta criptografada, particular e fora do repositório. **Nunca executar esse procedimento em um GitHub Actions público nem enviar o backup para este chat.**
5. Para criar uma lista SHA-256 LOCAL, mantendo o manifesto fora da pasta de dados:

```bash
node scripts/verify-backup-bundle.mjs create /caminho/backup /caminho/manifesto-privado.json
node scripts/verify-backup-bundle.mjs verify /caminho/backup /caminho/manifesto-privado.json
```

O manifesto contém nomes de arquivos, tamanhos e hashes, que também são sensíveis. Guarde-o privadamente. Não aceita links simbólicos, diretórios vazios, alterações silenciosas nem manifesto dentro da própria pasta.

## Prova de recuperação

Somente um teste em **projeto de homologação isolado** pode comprovar restauração. Comparar contagens de identidades, empresas, vagas, reservas e dados relacionados; validar permissões RLS, autenticação de contas de teste, funcionamento de imagens e hashes e integridade de chaves estrangeiras. Anotar data do teste, responsável, RTO, RPO e divergências. Nunca restaurar na produção como teste.

**Estado:** ferramental de verificação pronto; backup real e restore ainda NÃO executados. Nenhum dado de produção foi exportado nesta auditoria. Pix automático está fora do escopo.

Referências oficiais:
- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- https://supabase.com/docs/guides/self-hosting/restore-from-platform
