-- Avoid evaluating the administrator policy for anonymous readers.
-- The separate SELECT policy keeps active draw results publicly readable.
alter policy "Admins podem gerenciar resultados de sorteio"
on public.resultados_sorteio
to authenticated
using (private.admin_mfa_verified(null, false))
with check (private.admin_mfa_verified(null, false));
