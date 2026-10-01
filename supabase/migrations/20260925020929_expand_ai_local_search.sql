-- The assistant keeps short-lived anonymous conversations only long enough to
-- support follow-up questions and diagnose unanswered requests. Expired
-- sessions are removed after seven days; messages and events follow by cascade.
do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id from cron.job where jobname = 'ai-session-retention-daily';
  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
  perform cron.schedule(
    'ai-session-retention-daily',
    '17 3 * * *',
    $cron$delete from public.ai_sessions where expires_at < now() - interval '7 days'$cron$
  );
end
$$;
