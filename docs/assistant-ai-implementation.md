# Assistente IA — auditoria e execução incremental

Estado em 2026-09-16: fundação SQL preparada, **não aplicada**. A experiência de chat/voz não está ativa.

## Inventário confirmado no repositório

- Frontend React 18 + TypeScript + Vite, React Router e React Query; `npm run test` executa typecheck e lint.
- Supabase em `uyleozhwzngnvyddfvni`, com migrations, Auth, RLS e Edge Functions. O conector disponível nesta sessão lista apenas outros projetos; o estado do banco de produção ainda precisa ser confrontado com as migrations locais.
- Empresas: `public.empresas` tem dono (`usuario_id`), cidade/categoria, aprovação, `ativo`, plano atual e vencimento. Produtos e cupons têm `empresa_id`.
- Planos: `public.planos` contém preço e limites configuráveis. `public.pagamentos_planos` registra empresa, plano, status e vencimento. A UI atual faz fallback para gratuito quando o plano vence, mas isso não é autorização para a IA.
- Pagamento: `create-pix-payment` cria cobrança no Mercado Pago e devolve QR Code. Não foi localizado webhook de confirmação nessa Edge Function; os modais administrativos também atribuem plano diretamente. O estado de pagamento e a concessão manual devem ser reconciliados antes de ativar a descoberta comercial.
- Existem eventos, vagas, serviços autônomos, agendamento, cidades, categorias, ferramentas e cupons. Rotas empresariais em `/empresa-dashboard` e administrativas em `/admin`.
- Autorização admin tem proteção MFA no banco. Qualquer central de IA deve reaproveitar esse mecanismo, não criar um atalho paralelo.

## Adaptação arquitetural

A migration `20260916151132_ai_assistant_foundation.sql` cria entitlements por plano, controle global, bloqueio/concessão manual por empresa, sessões, mensagens, eventos e uso diário. Todas as tabelas novas têm RLS e nenhum acesso direto para `anon`/`authenticated`. A RPC `public.ai_eligible_companies` é executável somente por `service_role`, verifica aprovação, vigência, entitlement, pagamento confirmado **ou** concessão manual com prazo e motivo. Começa desabilitada globalmente e sem planos habilitados. Não há preço novo, cobrança por lead ou chamada de LLM nesta etapa.

## Próximas etapas e critérios

1. Conectar o projeto Supabase correto; comparar schema, grants, políticas e status reais de pagamento. Validar a migration em ambiente isolado, com testes SQL de casos permitidos/negados: sem plano, expirado, sem pagamento, bloqueado, cidade/categoria incompatível e acesso de cliente às tabelas.
2. Criar Edge Function com limite por sessão/IP/usuário, validação de entradas, busca determinística sobre a função de elegibilidade, criação de sessão e telemetria. Sem função pública até estes testes passarem.
3. Criar UI textual responsiva, ações mensuradas e contexto curto. O LLM entra apenas para interpretação/redação complexa, com provider server-side, orçamento, timeout e fallback determinístico.
4. Adicionar voz opcional e acessível, depois painéis da empresa/admin, FAQ, analytics e entitlements editáveis com auditoria e MFA.
5. Atualizar política de privacidade para refletir exatamente dados e provedores usados, antes de ativar coleta de conversas/voz em produção.

## Riscos conhecidos

- A migration local ainda não foi testada contra o banco real; não presumir que o schema de produção é idêntico aos tipos gerados.
- O typecheck, o build e `npx eslint src --quiet` passaram. `npm run test` não passou porque o lint global também inclui arquivos de um projeto paralelo não rastreado (`nexosnotes-site/.next`), fora do escopo desta mudança.
- Cobrança Pix criada não equivale a pagamento confirmado. A função de elegibilidade falha de forma fechada nesse caso.
- As telas atuais podem usar plano/vencimento no frontend para UX, mas a futura IA não deve usar isso como autorização.
- Métricas de lead/conversão só terão significado após definição e deduplicação dos eventos no endpoint.
