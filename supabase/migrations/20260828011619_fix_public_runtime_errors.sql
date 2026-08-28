-- A instalação do PWA pode ser registrada antes do usuário autenticar.
-- Restrinja a escrita pública somente às colunas esperadas pelo aplicativo.
grant insert (evento, plataforma)
on table public.estatisticas_pwa
to anon, authenticated;
