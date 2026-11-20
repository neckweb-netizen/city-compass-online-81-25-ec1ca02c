-- SECURITY DEFINER RPC is not executable by anonymous users through PUBLIC inheritance.
revoke execute on function public.usar_cupom(uuid) from public, anon;
grant execute on function public.usar_cupom(uuid) to authenticated;

-- Coupon owners cannot forge redemption counters. SECURITY DEFINER redemption RPC
-- executes under its owner and retains its ability to increment counters.
create or replace function private.guard_coupon_redemption_counter()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if current_user = 'authenticated' and
     new.quantidade_usada is distinct from old.quantidade_usada then
    raise exception 'O número de utilizações só pode ser alterado pelo resgate validado'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_coupon_redemption_counter on public.cupons;
create trigger guard_coupon_redemption_counter
before update on public.cupons for each row
execute function private.guard_coupon_redemption_counter();
