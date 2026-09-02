-- Register the home game section without resetting existing order or visibility.
insert into public.home_sections_order (section_name, display_name, ordem, ativo)
select 'jogos', 'Dominó / Jogos', coalesce(max(ordem), 0) + 1, true
from public.home_sections_order
on conflict (section_name) do nothing;

-- Correct the legacy label only; preserve custom labels, position and visibility.
update public.home_sections_order
set display_name = 'Banner adicional'
where section_name = 'stats_section' and display_name = 'Estatísticas';
