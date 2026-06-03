grant execute on function public.is_shop_admin() to anon, authenticated;
grant select on public.shop_admins to authenticated;
grant select, insert, update, delete on public.shop_products to authenticated;

drop policy if exists "Shop admins can manage products" on public.shop_products;
create policy "Shop admins can manage products"
on public.shop_products
for all
using (public.is_shop_admin())
with check (public.is_shop_admin());

drop policy if exists "Admins can read admin list" on public.shop_admins;
create policy "Admins can read admin list"
on public.shop_admins
for select
using (public.is_shop_admin());
