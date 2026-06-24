-- Criar job de cron para gerenciar eventos automaticamente
-- Executa a cada 6 horas para finalizar eventos expirados e deletar antigos
select
  cron.schedule(
    'manage-eventos-job',
    '0 */6 * * *', -- A cada 6 horas
    $$
    select
      net.http_post(
          url:='https://uyleozhwzngnvyddfvni.supabase.co/functions/v1/manage-eventos',
          headers:='{"Content-Type": "application/json"}'::jsonb,
          body:='{"scheduled": true}'::jsonb
      ) as request_id;
    $$
  );