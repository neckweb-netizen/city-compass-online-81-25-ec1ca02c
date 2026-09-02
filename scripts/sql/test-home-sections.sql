-- Transactional regression test: every change is rolled back.
begin;
do $test$
declare before_ids jsonb;
begin
  select jsonb_object_agg(section_name, id) into before_ids from public.home_sections_order;
  insert into public.home_sections_order (section_name, display_name, ordem, ativo)
  select section_name, display_name,
    row_number() over (order by (section_name = 'jogos') desc, ordem, section_name)::integer,
    case when section_name = 'jogos' then false else ativo end
  from public.home_sections_order
  on conflict (section_name) do update set ordem = excluded.ordem, ativo = excluded.ativo;
  if not exists (select 1 from public.home_sections_order where section_name = 'jogos' and ordem = 1 and ativo = false) then
    raise exception 'Order/visibility save failed';
  end if;
  if before_ids <> (select jsonb_object_agg(section_name, id) from public.home_sections_order) then
    raise exception 'Upsert changed existing row identifiers';
  end if;
end $test$;
set local role anon;
do $test$
begin
  if exists (select 1 from public.home_sections_order where not ativo or section_name = 'jogos') then
    raise exception 'Hidden sections leaked to public readers';
  end if;
  if not exists (select 1 from public.home_sections_order where section_name = 'search') then
    raise exception 'Public section read is blocked';
  end if;
end $test$;
rollback;
