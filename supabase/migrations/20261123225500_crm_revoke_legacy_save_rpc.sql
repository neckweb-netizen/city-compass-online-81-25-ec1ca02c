-- The new owner-bound RPC is deployed and confirmed available.
-- Remove the legacy callable route that lacks an explicit expected user id.
revoke execute on function public.save_crm_caderno(bigint,jsonb) from authenticated;
revoke all on function public.save_crm_caderno(bigint,jsonb) from public,anon;
