-- Every published, approved company can be discovered. A valid commercial
-- plan changes ordering only; it never controls basic visibility.
create or replace function public.ai_eligible_companies(
  p_city_id uuid default null,
  p_category_id uuid default null,
  p_limit integer default 1000
)
returns table (company_id uuid, plan_id uuid)
language sql stable security invoker
set search_path = ''
as $$
  select e.id, p.id
  from public.empresas e
  join public.ai_settings s on s.id = true and s.enabled and not s.maintenance
  left join public.planos p on p.id = e.plano_atual_id
  left join public.ai_company_access access on access.company_id = e.id
  where e.ativo
    and e.status_aprovacao = 'aprovado'::public.status_aprovacao
    and not coalesce(access.blocked, false)
    and (p_city_id is null or e.cidade_id = p_city_id)
    and (p_category_id is null or e.categoria_id = p_category_id)
  order by
    case when p.ativo
      and e.plano_data_vencimento > now()
      and coalesce(p.prioridade_busca, 0) > 0
      and (
        access.manual_grant_until > now()
        or exists (
          select 1 from public.pagamentos_planos pay
          where pay.empresa_id = e.id
            and pay.plano_id = p.id
            and lower(pay.status) in ('aprovado', 'approved', 'pago', 'paid', 'concluido')
            and pay.data_vencimento > now()
        )
      ) then p.prioridade_busca else 0 end desc,
    e.id
  limit least(greatest(coalesce(p_limit, 1000), 1), 1000);
$$;

revoke all on function public.ai_eligible_companies(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.ai_eligible_companies(uuid, uuid, integer) to service_role;
