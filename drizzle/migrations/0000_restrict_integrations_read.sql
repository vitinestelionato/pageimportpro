DROP POLICY IF EXISTS "integrations readable by everyone" ON public.integrations;
REVOKE SELECT ON public.integrations FROM anon;
CREATE POLICY "Signed-in users can view active integrations" ON public.integrations FOR SELECT TO authenticated USING (is_active = true OR is_coming_soon = true);