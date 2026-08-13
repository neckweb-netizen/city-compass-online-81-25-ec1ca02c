# Publicação das correções de segurança

As correções locais só passam a proteger o ambiente online depois que a migração e as funções do Supabase forem publicadas.

## 1. Trocar credenciais que podem ter sido expostas

- Revogue e gere uma nova chave da API do Google Maps. Restrinja-a às APIs e ao projeto necessários.
- Revogue e gere um novo token de acesso do Mercado Pago. O endpoint antigo permitia obter esse segredo.
- Se houver dúvida sobre uso indevido do armazenamento, troque também as chaves do Cloudflare R2.

Nunca coloque essas credenciais em arquivos do frontend ou em variáveis com prefixo `VITE_`.

## 2. Configurar os segredos das funções

Cadastre no painel do Supabase, em **Edge Functions > Secrets**:

- `ALLOWED_ORIGINS`: `https://sajtem.com,https://www.sajtem.com`
- `SITE_URL`: `https://sajtem.com`
- `CONTACT_EMAIL`: endereço que deve receber o formulário de contato
- `CRON_SECRET`: valor longo e aleatório, também enviado no cabeçalho `x-cron-secret` da rotina de eventos
- `GOOGLE_MAPS_API_KEY`
- `MERCADO_PAGO_ACCESS_TOKEN`
- `RESEND_API_KEY`
- `OPENWEATHER_API_KEY`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`

O Supabase fornece automaticamente `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` às funções. Não exponha a chave `service_role` no navegador.

## 3. Aplicar banco e funções

Com a CLI do Supabase autenticada e vinculada ao projeto correto:

```bash
supabase db push
supabase functions deploy create-pix-payment
supabase functions deploy create-short-url
supabase functions deploy get-mercado-pago-token
supabase functions deploy google-places-admin
supabase functions deploy log-security-event
supabase functions deploy manage-eventos
supabase functions deploy rate-limit-check
supabase functions deploy redirect-short-url
supabase functions deploy send-contact-email
supabase functions deploy send-empresa-notification
supabase functions deploy send-event-notification
supabase functions deploy send-welcome-email
supabase functions deploy upload-r2
supabase functions deploy weather
```

A migração principal desta revisão é `supabase/migrations/20260813000100_security_hardening.sql`.

## 4. Publicar e conferir

- Publique o frontend com o novo `vercel.json` para ativar os cabeçalhos de segurança.
- Teste login, cadastro, upload de imagem, formulário de contato, PIX e importação do Google usando contas com papéis diferentes.
- Confirme que um usuário comum não acessa páginas administrativas nem consegue alterar o próprio papel.
- Regere os tipos TypeScript a partir do banco publicado e restaure a tipagem estrita do cliente em `src/integrations/supabase/client.ts`.
