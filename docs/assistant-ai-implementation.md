# Assistente IA — auditoria e execução incremental

Estado em 2026-09-16: fundação e controles SQL aplicados ao projeto Supabase `uyleozhwzngnvyddfvni`; a Edge Function `assistente-ia` está publicada, mas o controle global segue **desativado**. O chat foi enviado ao GitHub no commit `6091a51`; aguarda confirmação do deploy no site publicado.

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

A migration `20260916190000_ai_assistant_controls.sql` adiciona limites configuráveis (1.000 consultas globais/dia, 100 chamadas de modelo/dia, 20 consultas por visitante/dia e 500 caracteres/mensagem), além de uma reserva atômica no banco via `public.ai_consume_quota`. Apenas `service_role` pode consumi-la. O admin geral com MFA AAL2 pode configurar limites e escolher planos para `discovery` em `/admin/planos`. A função publicada já consome a cota antes de responder e limita saída/tempo na chamada ao provedor.

A função `assistente-ia` agora chama a reserva antes de responder. A cota do modelo é separada por `20260916201500_ai_assistant_model_quota.sql` e pode ser usada pelo teste administrativo sem ativar o chat, conforme `20260916220000_ai_model_diagnostic_quota.sql`. Ela valida a chave pública do projeto, limita corpo e mensagem, mantém uma sessão de 24 horas com token opaco, consulta só empresas elegíveis, busca por nome/descrição/categoria e chama Gemini apenas como fallback de interpretação de perguntas mais complexas. O modelo não decide quais empresas são elegíveis. Há um chat responsivo com entrada textual, voz do navegador quando suportada e leitura opcional da resposta. Ações de abertura de perfil e impressões são registradas com revalidação de sessão/resultado. Ainda não há produtos, cupons, agenda, busca semântica, analytics de custos ou cobertura integral das intenções do plano mestre.

`20260916210000_ai_admin_company_grants.sql` permite ao admin geral com MFA registrar, no próprio painel, uma concessão excepcional por empresa com motivo e prazo quando o plano foi atribuído manualmente. Isso não substitui aprovação, plano elegível e vigência.

O modelo previsto é `gemini-3.1-flash-lite`, sem chave no código. Em 16/09/2026, a conferência no Supabase Dashboard → Edge Functions → Secrets confirmou o nome exato `GEMINI_API_KEY`, com atualização às 16:34 UTC. O valor não foi aberto. A presença do segredo não confirma conexão real: o diagnóstico ainda exige sessão admin AAL2. Não usar variável `VITE_`, Vercel frontend ou este painel para a chave. Não ativar o assistente antes de testar o diagnóstico com MFA, confirmar o deploy e selecionar plano e empresa elegíveis.

## Ativação segura pendente

1. Os commits `fbfd2e9` e `6091a51` foram publicados no GitHub; confirmar que o deploy de produção contém `6091a51` ou posterior.
2. Em `/admin/planos`, após MFA, usar **Testar chave Gemini**. Apenas sucesso nesse teste confirma que o secret é utilizável; o botão não revela a chave.
3. Habilitar `discovery` somente nos planos desejados. Para uma empresa com plano atribuído manualmente, registrar prazo e motivo da concessão. Conferir vigência/aprovação.
4. Ligar **Assistente ativo**, carregar o site como visitante e testar busca, ausência de resultados, limite e abertura de perfil. Desligar ou usar modo manutenção se houver erro.

## Próximas etapas e critérios

1. Validar o motor de elegibilidade em ambiente isolado com testes SQL de casos permitidos/negados: sem plano, expirado, sem pagamento, bloqueado, cidade/categoria incompatível e acesso de cliente às tabelas. A verificação em produção confirmou `enabled=false`, nenhum entitlement, zero empresas elegíveis e nenhuma permissão de leitura/gravação para `anon`/`authenticated` nas tabelas novas.
2. A função de busca e o chat inicial existem e o endpoint público foi testado em modo desligado: status 200 com `enabled:false`, chat 503 e diagnóstico sem admin 401. Ainda falta teste end-to-end com empresa elegível.
3. Ampliar busca além dos primeiros 20 candidatos elegíveis e adicionar intents/produtos/cupons/eventos. O LLM hoje interpreta termo de busca como fallback; não redige respostas livres.
4. Completar analytics, custo real/token, retenção, painel da empresa, FAQ e testes cross-browser de voz. O controle de planos e limites no admin já existe; ainda falta auditoria dedicada das mudanças desses controles.
5. Atualizar política de privacidade para refletir exatamente dados e provedores usados, antes de ativar coleta de conversas/voz em produção.

## Riscos conhecidos

- A fundação foi aplicada ao banco real e os grants foram verificados; faltam testes controlados com empresas de teste, sem alterar cadastros comerciais reais.
- O typecheck, o build e `npx eslint src --quiet` passaram. `npm run test` não passou porque o lint global também inclui arquivos de um projeto paralelo não rastreado (`nexosnotes-site/.next`), fora do escopo desta mudança.
- Cobrança Pix criada não equivale a pagamento confirmado. A função de elegibilidade falha de forma fechada nesse caso.
- No projeto real, `pagamentos_planos` tem zero linhas e apenas uma empresa está com plano e vigência ativos. Habilitar planos no admin sem pagamento confirmado ou concessão explícita não produz recomendações; não afrouxar silenciosamente essa regra.
- Os eventos ainda têm FK com exclusão em cascata para as sessões. Não excluir sessões até definir e testar uma política de retenção/agregação que preserve as métricas necessárias sem comprometer a integridade referencial.
- As telas atuais podem usar plano/vencimento no frontend para UX, mas a futura IA não deve usar isso como autorização.
- Métricas de lead/conversão só terão significado após definição e deduplicação dos eventos no endpoint.
