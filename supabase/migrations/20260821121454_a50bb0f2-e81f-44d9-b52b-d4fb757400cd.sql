-- Orders are now created exclusively by the create-order edge function,
-- which computes totals and prices from the products catalog server-side.
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their order items" ON public.order_items;

REVOKE INSERT ON public.orders FROM anon, authenticated;
REVOKE INSERT ON public.order_items FROM anon, authenticated;

GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;