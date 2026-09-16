# Assistente IA — auditoria e execução incremental

Estado em 2026-09-16: fundação e controles SQL aplicados ao projeto Supabase `uyleozhwzngnvyddfvni`, mas **desativados**. A experiência de chat/voz não está ativa.

## Inventário confirmado no repositório

- Frontend React 18 + TypeScript + Vite, React Router e React Query; `npm run test` executa typecheck e lint.
- Supabase em `uyleozhwzngnvyddfvni`, com migrations, Auth, RLS e Edge Functions. O schema de empresas, planos e pagamentos foi conferido diretamente nesse projeto.
- Empresas: `public.empresas` tem dono (`usuario_id`), cidade/categoria, aprovação, `ativo`, plano atual e vencimento. Produtos e cupons têm `empresa_id`.
- Planos: `public.planos` contém preço e limites configuráveis. `public.pagamentos_planos` registra empresa, plano, status e vencimento. A UI atual faz fallback para gratuito quando o plano vence, mas isso não é autorização para a IA.
- Pagamento: `create-pix-payment` cria cobrança no Mercado Pago e devolve QR Code. Não foi localizado webhook de confirmação nessa Edge Function; os modais administrativos também atribuem plano diretamente. O estado de pagamento e a concessão manual devem ser reconciliados antes de ativar a descoberta comercial.
- Existem eventos, vagas, serviços autônomos, agendamento, cidades, categorias, ferramentas e cupons. Rotas empresariais em `/empresa-dashboard` e administrativas em `/admin`.
- Autorização admin tem proteção MFA no banco. Qualquer central de IA deve reaproveitar esse mecanismo, não criar um atalho paralelo.

## Adaptação arquitetural

A migration `20260916151132_ai_assistant_foundation.sql` cria entitlements por plano, controle global, bloqueio/concessão manual por empresa, sessões, mensagens, eventos e uso diário. Todas as tabelas novas têm RLS e nenhum acesso direto para `anon`/`authenticated`. A RPC `public.ai_eligible_companies` é executável somente por `service_role`, verifica aprovação, vigência, entitlement, pagamento confirmado **ou** concessão manual com prazo e motivo. Começa desabilitada globalmente e sem planos habilitados. Não há preço novo, cobrança por lead ou chamada de LLM nesta etapa.

A migration `20260916190000_ai_assistant_controls.sql` adiciona limites configuráveis (1.000 consultas globais/dia, 100 chamadas de modelo/dia, 20 consultas por visitante/dia e 500 caracteres/mensagem), além de uma reserva atômica no banco via `public.ai_consume_quota`. Apenas `service_role` pode consumi-la. O admin geral com MFA AAL2 pode configurar limites e escolher planos para `discovery` em `/admin/planos`. A função pública futura **deve** chamar a reserva antes de cada resposta e limitar tokens/timeout na chamada ao provedor; sem essa integração os limites não controlam tráfego porque ainda não há endpoint público.

O modelo previsto é `gemini-3.1-flash-lite`, sem chave no código. Quando o endpoint estiver implantado, cadastrar `GEMINI_API_KEY` em Supabase Dashboard → Edge Functions → Secrets. Não usar variável `VITE_`, Vercel frontend ou este painel para a chave. Não ativar o assistente antes de testar o endpoint e reconciliar pagamento/concessões.

## Próximas etapas e critérios

1. Validar o motor de elegibilidade em ambiente isolado com testes SQL de casos permitidos/negados: sem plano, expirado, sem pagamento, bloqueado, cidade/categoria incompatível e acesso de cliente às tabelas. A verificação em produção confirmou `enabled=false`, nenhum entitlement, zero empresas elegíveis e nenhuma permissão de leitura/gravação para `anon`/`authenticated` nas tabelas novas.
2. Criar Edge Function com limite por sessão/IP/usuário, validação de entradas, busca determinística sobre a função de elegibilidade, criação de sessão e telemetria. Sem função pública até estes testes passarem.
3. Criar UI textual responsiva, ações mensuradas e contexto curto. O LLM entra apenas para interpretação/redação complexa, com provider server-side, orçamento, timeout e fallback determinístico.
4. Adicionar voz opcional e acessível, depois painel da empresa, FAQ e analytics. O controle de planos e limites no admin já existe; ainda falta a auditoria dedicada das mudanças desses controles.
5. Atualizar política de privacidade para refletir exatamente dados e provedores usados, antes de ativar coleta de conversas/voz em produção.

## Riscos conhecidos

- A fundação foi aplicada ao banco real e os grants foram verificados; faltam testes controlados com empresas de teste, sem alterar cadastros comerciais reais.
- O typecheck, o build e `npx eslint src --quiet` passaram. `npm run test` não passou porque o lint global também inclui arquivos de um projeto paralelo não rastreado (`nexosnotes-site/.next`), fora do escopo desta mudança.
- Cobrança Pix criada não equivale a pagamento confirmado. A função de elegibilidade falha de forma fechada nesse caso.
- No projeto real, `pagamentos_planos` tem zero linhas e apenas uma empresa está com plano e vigência ativos. Habilitar planos no admin sem pagamento confirmado ou concessão explícita não produz recomendações; não afrouxar silenciosamente essa regra.
- Os eventos ainda têm FK com exclusão em cascata para as sessões. Não excluir sessões até definir e testar uma política de retenção/agregação que preserve as métricas necessárias sem comprometer a integridade referencial.
- As telas atuais podem usar plano/vencimento no frontend para UX, mas a futura IA não deve usar isso como autorização.
- Métricas de lead/conversão só terão significado após definição e deduplicação dos eventos no endpoint.
