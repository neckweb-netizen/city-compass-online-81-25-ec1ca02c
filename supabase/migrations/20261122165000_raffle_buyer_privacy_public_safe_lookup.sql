-- Public raffle cards expose only status/number, never buyer contact details.
-- Full buyer details remain visible only to the owner or an MFA-verified admin.
create or replace function public.get_public_raffle(p_id uuid)
returns jsonb language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'id', r.id, 'user_id', r.user_id, 'titulo', r.titulo, 'premio', r.premio,
    'valor_numero', r.valor_numero, 'chave_pix', r.chave_pix,
    'data_sorteio', r.data_sorteio, 'hora_sorteio', r.hora_sorteio,
    'tipo_rifa', r.tipo_rifa, 'qtd_numeros', r.qtd_numeros,
    'numeros', (
      select coalesce(jsonb_agg(
        jsonb_build_object('numero', n.item->>'numero', 'status', n.item->>'status')
        order by n.ordinality
      ), '[]'::jsonb)
      from jsonb_array_elements(coalesce(r.numeros, '[]'::jsonb))
        with ordinality as n(item, ordinality)
    )
  )
  from public.rifas_usuarios r where r.id = p_id;
$$;
revoke all on function public.get_public_raffle(uuid) from public;
grant execute on function public.get_public_raffle(uuid) to anon, authenticated;

-- The reservation RPC may be called by guests: sanitize the returned array too.
create or replace function public.atualizar_numero_rifa(
  p_rifa_id uuid, p_numero text, p_status text,
  p_nome text default null, p_telefone text default null
)
returns jsonb language sql set search_path = ''
as $$
  select coalesce(jsonb_agg(item - 'nome' - 'telefone' order by ordinality), '[]'::jsonb)
  from jsonb_array_elements(
    private.atualizar_numero_rifa(p_rifa_id, p_numero, p_status, p_nome, p_telefone)
  ) with ordinality as x(item, ordinality);
$$;

drop policy if exists "Qualquer pessoa pode visualizar rifas pelo link" on public.rifas_usuarios;
drop policy if exists "Criador ou admin MFA visualiza dados pessoais da rifa" on public.rifas_usuarios;
create policy "Criador ou admin MFA visualiza dados pessoais da rifa"
  on public.rifas_usuarios for select to authenticated
  using (user_id = (select auth.uid()) or private.admin_mfa_verified(NULL::uuid, false));
