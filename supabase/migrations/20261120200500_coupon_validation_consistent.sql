-- Coupon validation must obey the same visibility and redemption rules as the public catalog.
create or replace function public.validar_cupom(codigo_param text, empresa_id_param uuid)
returns table (
  valido boolean, cupom_id uuid, titulo text, tipo text,
  valor numeric, mensagem text
)
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_cupom public.cupons%rowtype;
begin
  select c.* into v_cupom from public.cupons c
  where c.codigo = upper(trim(codigo_param))
    and c.empresa_id = empresa_id_param
    and c.ativo = true
    and c.data_inicio <= now()
    and c.data_fim >= now()
    and exists (
      select 1 from public.empresas e
      where e.id = c.empresa_id and e.ativo = true
        and e.status_aprovacao = 'aprovado'
    );

  if not found then
    return query select false, null::uuid, null::text, null::text,
      null::numeric, 'Cupom não encontrado ou fora da validade'::text;
    return;
  end if;

  if v_cupom.quantidade_total is not null
     and v_cupom.quantidade_usada >= v_cupom.quantidade_total then
    return query select false, v_cupom.id, v_cupom.titulo,
      v_cupom.tipo::text, v_cupom.valor, 'Cupom esgotado'::text;
    return;
  end if;

  return query select true, v_cupom.id, v_cupom.titulo,
    v_cupom.tipo::text, v_cupom.valor, 'Cupom válido'::text;
end;
$$;
