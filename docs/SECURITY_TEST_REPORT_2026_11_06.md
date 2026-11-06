# Relatório de testes de segurança — 06/11/2026

Ambiente: produção do projeto Supabase `uyleozhwzngnvyddfvni` e repositório `neckweb-netizen/city-compass-online-81-25-ec1ca02c`.

## Testes executados
- `npm ci`, TypeScript, ESLint, build Vite e `npm audit --audit-level=high --omit=dev` passaram no [GitHub Actions](https://github.com/neckweb-netizen/city-compass-online-81-25-ec1ca02c/actions/runs/42197361779) antes do merge das correções.
- Edge Functions `create-pix-payment`, `google-places-admin` e `send-fcm-notification`: requisições POST sem credenciais retornaram HTTP 401 na [execução de smoke tests](https://github.com/neckweb-netizen/city-compass-online-81-25-ec1ca02c/actions/runs/42203177804).
- Banco: perfil `anon` e `authenticated` tiveram SELECT negado sobre `public.pix_payment_intents` por falta de privilégios. RLS da tabela habilitada, chave primária do identificador Pix, unicidade do identificador do provedor e INSERT/UPDATE para `service_role` confirmados.
- Banco: consulta pública a `empresas` com perfil anônimo funcionou; administrador sem identidade autenticada não passou em `private.admin_mfa_verified`.
- Banco: teste transacional inseriu uma intenção Pix sintética, tentou repetir a chave com `ON CONFLICT DO NOTHING`, confirmou existência de exatamente uma linha e executou `ROLLBACK`. A tabela permaneceu vazia após o teste. Nenhum Pix ou pagamento real foi gerado.
- Banco: trigger `protect_empresa_sensitive_fields_trigger` está ativo em `public.empresas`.
- Supabase Advisors: nenhuma advertência de saúde; avisos de segurança sobre GraphQL, funções SECURITY DEFINER e proteção contra senhas vazadas continuam pendentes de triagem.

## Limitação: disponibilidade do domínio
O teste HTTPS de `https://sajtem.com/` não pôde alcançar o site porque o runner retornou `curl: (6) Could not resolve host: sajtem.com`. Isso não permite concluir que o frontend esteja disponível ou indisponível em outro domínio. O teste foi mantido como informativo (`continue-on-error`) e a pendência está documentada na [issue #3](https://github.com/neckweb-netizen/city-compass-online-81-25-ec1ca02c/issues/3).

## Testes ainda necessários
- Checkout Pix ponta a ponta em sandbox do Mercado Pago, com conta de teste, webhook verificado, reenvio da mesma intenção, falha 5xx e queda antes de salvar o retorno. Não testar com pagamento real.
- Fluxos de aprovação/edição com contas de dono de empresa, administrador municipal (com e sem MFA) e administrador geral, usando dados inteiramente sintéticos em staging.
- Testes de navegador (cadastro, planos, formulários, PWA) contra domínio realmente publicado e com DNS funcional.
- Validar se as quatro funções SECURITY DEFINER disponíveis ao público exigem limitação/alteração de permissões e ativar proteção contra senhas vazadas, conforme política da aplicação.

## Interpretação
Os testes automatizados e as verificações de privilégio passaram nos cenários executados, mas **não equivalem a uma homologação completa em produção**, nem comprovam ausência de vulnerabilidades. Não foram enviados dados de pagamento reais nem modificados registros de clientes.
