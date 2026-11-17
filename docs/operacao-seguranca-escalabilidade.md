# SAJ TEM — operação, segurança e preparação para escala

Atualizado em 17/11/2026. **Pix automático fica expressamente fora deste trabalho**: retomar apenas quando o proprietário solicitar "Pix automático" e fornecer configurações em ambiente apropriado. Nenhum segredo deve ser salvo no GitHub.

## Mudanças aplicadas no Supabase de produção
- Migração `20261117105841_optimize_selected_rls_auth_uid_initplans`: nove políticas RLS selecionadas usam `(select auth.uid())`, conservando seus predicados de autorização e comandos. Auditoria `auth_rls_initplan`: 82 → 73 avisos.
- Migração `20261117110033_index_booking_and_neighborhood_fkeys`: três índices B-tree para `agendamentos.cliente_usuario_id`, `agendamentos.servico_id` e `bairros.cidade_id`. Auditoria de FKs sem índice: 78 → 75 avisos.
- Essas migrações já constam no histórico remoto e foram adicionadas ao repositório somente para manter a trilha auditável. Não aplicar novamente à produção manualmente.

## Auditoria de permissões
- Algumas RPCs `SECURITY DEFINER` acessíveis a anônimos são necessárias para enquetes, horários e agendamentos. Revisar uma por uma, sem revogar acesso indiscriminadamente.
- A função de agendamento público valida dados, verifica estabelecimento aprovado e possui limitação de volume no banco. A função de contagem de visualizações também limita operações por minuto.
- `auth_leaked_password_protection` aparece desabilitada. Avaliar ativação no Supabase Auth pelo painel com permissões de proprietário. **Não está ativa** por este projeto.
- O aviso `rls_enabled_no_policy` pode ser proposital em tabelas privadas de contadores: não adicionar políticas de leitura pública.
- Não remover índices sinalizados como não utilizados sem observar período representativo.
- Restringir permissões de RPCs privilegiadas depois de inventariar clientes e funções dependentes.

## Registro empresarial (sem cobranças automáticas)
1. Visitante inicia em `/anuncie-gratis` e escolhe cadastro de empresa.
2. Conta existente autenticada utiliza `/cadastro-local`; visitante novo pode criar conta pelo diálogo.
3. Confirmação de e-mail: se exigida pelo Supabase, usuário precisa confirmar e fazer login para finalizar cadastro da empresa. **Não tratar conta pendente como empresa aprovada.**
4. Cadastro insere empresa vinculada ao proprietário autenticado; slug recebe sufixo aleatório para evitar colisões e consultas repetidas.
5. O fluxo administrativo aprova ou rejeita; apenas perfis básicos aprovados ficam na listagem pública. Destaques/banners exigem os direitos comerciais correspondentes.
6. Sem conta de teste isolada, a verificação desta etapa é de código e CI, **não um teste ponta a ponta com criação real de uma empresa em produção**.

## Backup e recuperação
No plano Supabase Free **não há backups automáticos diários com retenção disponibilizada no painel**. Antes de operações críticas:
1. Com acesso autorizado a um computador, use Supabase CLI (versão atual) e `supabase db dump --help` para exportar esquema e dados para armazenamento **criptografado, privado e fora do repositório**; nunca incluir credenciais no Git, logs ou chat.
2. Não confundir exportação de tabelas com backup completo de Auth, Storage e políticas. Documentar separadamente objetos de Storage, configuração/Auth, Edge Functions e variáveis de ambiente; guardar cópias e inventário de segredos com acesso mínimo.
3. Restaurar **somente em projeto de teste isolado**, validar contagens e operações de autenticação, e registrar RTO/RPO medidos. Nunca executar restore em produção como teste.
4. Após migrar para Pro, verificar backups diários e retenção no painel; avaliar PITR se RPO exigir. Dados e arquivos ainda podem precisar de exportações complementares.
5. Antes do lançamento, registrar um restore testado e sua data. **Esta etapa não executou exportação de dados nem restauração.**

Documentação: https://supabase.com/docs/guides/platform/backups

## Capacidade e custo
- `node scripts/public-read-load-smoke.mjs --allow-small-smoke --allow-production` executa **apenas 12 GETs anônimos** em quatro rotas públicas (limite fixo de duas tarefas em paralelo), registra p50/p95/cache HIT e não mede usuários simultâneos.
- Para ambientes de homologação, passar `SAJTEM_SMOKE_BASE_URL=https://...` e adicionar `--allow-external`.
- Não executar teste 100/500/2 mil/5 mil/20 mil virtual users contra Vercel Hobby/Supabase Free de produção sem autorização operacional, observabilidade e infraestrutura dimensionada.
- Os ensaios de capacidade devem utilizar contas e dados fictícios em staging, cenários de navegação representativos (cache hit/miss, busca, login, recursos premium, IA, Realtime), ramp-up, limites de erros e critérios de parada. Planejar quotas e alertas de custo antes de ativar o plano Pro.
- Os resultados de smoke local **não provam** capacidade para 20 mil usuários.

## Critérios de aceitação para lançamento
- Validar cadastro de empresa real **somente** com conta de teste e autorização, incluindo confirmação de email, aprovação e visibilidade.
- Confirmar que plano gratuito funciona e que recursos premium permanecem protegidos pelo servidor.
- Confirmar função de agendamento com filtros antispam, redirecionamentos de autenticação e RLS por proprietários.
- Verificar backup com restauração em staging, telemetria, alertas e limites mensais.
- Depois da compra dos planos Pro, realizar teste de carga gradual e estabelecer a capacidade medida. 
