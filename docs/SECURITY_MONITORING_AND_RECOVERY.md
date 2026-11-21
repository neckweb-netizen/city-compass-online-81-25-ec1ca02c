# Segurança operacional — monitoramento e recuperação (Saj Tem)

## O que funciona agora

- GitHub Actions: `Production security smoke tests` é executado em pushes de `main`, manualmente e diariamente às 11:00 UTC (08:00 Bahia), sem autenticação e sem gerar dados financeiros.
- Testa HTTPS no subdomínio de produção atual `sajtem.vercel.app` e rejeição de requisições anônimas às Edge Functions Pix, Google Places Admin, notificações, upload R2 e logs de segurança.
- `log-security-event` mantém registros `client_reported`, sem considerar eventos enviados pelo navegador como prova de login ou incidente confirmado. Limite de 20 eventos/usuário/minuto e orçamento global pelo RPC `consume_edge_rate_limit`.
- Logs de segurança: leitura apenas por administradores com MFA e escopo apropriado; alteração via REST por usuário comum revogada.

## Falhas e sinais de alerta

1. Acesse **GitHub Actions → Production security smoke tests** para encontrar execuções falhas. Habilite as notificações do GitHub para o repositório; este workflow, sozinho, não garante entrega de e-mail/WhatsApp.
2. Veja **Supabase → Logs → Edge Functions** para resposta 401/403, 429, 5xx e erros de RPC. Evite copiar tokens, CPF ou dados de clientes nos tickets.
3. Veja **Vercel → Deployments** e logs da aplicação; confirme status do deploy e comportamento do site.
4. Não interprete um evento `client_reported` como evidência confiável de intrusão; o usuário pode originar eventos próprios.
5. Caso os logs de segurança permaneçam zerados, isso não comprova ausência de incidentes. Verifique que a função e a instrumentação do frontend de fato estão produzindo eventos.

## Backups

- Confirme em **Supabase → Database → Backups** o plano, a data do backup mais recente e a política de retenção.
- Conforme a documentação oficial do Supabase, backups diários gerenciados estão disponíveis em Pro, Team e Enterprise; em projetos Free, planeje exportações regulares via Supabase CLI `db dump` e armazenamento externo criptografado.
- A rotina de backup precisa cobrir também os objetos no Supabase Storage e Cloudflare R2, segredos de configuração e passos de reimplantação das Edge Functions; backup do banco não equivale automaticamente ao backup do R2.
- Execute periodicamente uma **restauração de teste em um ambiente separado** antes de considerar a recuperação comprovada. Nunca experimente restaurar um backup sobre o projeto de produção.
- Registre a data do último teste de recuperação, integridade, responsável e tempo de restauração. Não marque como concluído até realizar o teste.

Fontes:
- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery

## Pendências

- Ainda não existe monitoramento validado de alertas com entrega externa nem teste real de restauração.
- Eventuais rotinas de limpeza de logs e contadores só devem ser configuradas após decidir prazo de retenção e verificar requisitos legais.
- A migração completa de Pix automático/ativação de plano será uma etapa própria de homologação.

## Exclusão de contas e integridade referencial (21/11/2026)

- A exclusão direta de `public.usuarios` foi bloqueada na política RLS e o privilégio `DELETE` foi revogado de `authenticated`. O botão de exclusão do painel administrativo está desativado.
- **Por quê:** vínculos `ON DELETE CASCADE` podem remover empresas, avaliações e estatísticas; vínculos `RESTRICT/NO ACTION` podem impedir a remoção; e uma exclusão do perfil não remove o usuário de `auth.users`.
- Antes de implementar a exclusão definitiva: inventariar dependências, definir política de retenção e anonimização, exportar dados necessários, confirmar identidade e MFA do operador, registrar auditoria e criar operação transacional/servidor confiável para Auth + dados + Storage, contemplando falhas parciais. Validar tudo em ambiente isolado.
- **Nenhuma conta ou dado de produção foi excluído nesta correção.** A exclusão completa de contas ainda **não foi implementada**.

## Teste de restauração ainda pendente

- Este documento é apenas o procedimento; **não é evidência de backup realizado**. É preciso exportar banco e autenticação conforme ferramentas oficiais, inventariar Storage/R2, manter cópias criptografadas e testar restauração num projeto separado.
- Registrar data, responsável, verificações de integridade, tempo de recuperação e resultado antes de declarar o plano de continuidade aprovado.
