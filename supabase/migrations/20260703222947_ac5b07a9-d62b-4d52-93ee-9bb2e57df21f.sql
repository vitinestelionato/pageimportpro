
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

CREATE POLICY "No client access to activation_tokens" ON public.activation_tokens
  FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "No client access to webhook_logs" ON public.webhook_logs
  FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);
