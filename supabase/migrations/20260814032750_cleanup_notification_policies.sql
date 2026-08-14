-- Remove políticas antigas que ficaram duplicadas após a consolidação.
drop policy if exists "Usuários podem ver suas notificações" on public.notifications;
drop policy if exists "Usuários podem marcar notificações como lidas" on public.notifications;
