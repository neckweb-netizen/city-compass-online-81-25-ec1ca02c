-- A criacao publica passa exclusivamente pela RPC, que valida empresa,
-- servico, expediente, antecedencia e conflitos dentro de uma transacao.
revoke all on function public.validar_agendamento_antes_insert() from public, anon, authenticated;
revoke insert on table public.agendamentos from anon, authenticated;

drop policy if exists "Anyone can create appointments for active business" on public.agendamentos;
drop policy if exists "Usuários autenticados podem criar agendamentos" on public.agendamentos;
