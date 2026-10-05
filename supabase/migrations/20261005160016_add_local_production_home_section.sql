do $$
declare
  target_order integer;
begin
  if not exists (
    select 1
    from public.home_sections_order
    where section_name = 'producao_local'
  ) then
    select coalesce(min(ordem), 1)
      into target_order
    from public.home_sections_order
    where section_name = 'stories';

    update public.home_sections_order
      set ordem = ordem + 1,
          atualizado_em = now()
      where ordem >= target_order;

    insert into public.home_sections_order (section_name, display_name, ordem, ativo)
    values ('producao_local', 'Produção Local', target_order, true);
  end if;
end
$$;
