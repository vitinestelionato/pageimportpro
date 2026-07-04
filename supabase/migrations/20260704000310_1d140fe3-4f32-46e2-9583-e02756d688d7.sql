-- Explicit deny policies for client role modifications on user_roles.
-- Service role bypasses RLS and continues to manage roles from the backend.
CREATE POLICY "Deny client inserts on user_roles"
  ON public.user_roles
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "Deny client updates on user_roles"
  ON public.user_roles
  FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny client deletes on user_roles"
  ON public.user_roles
  FOR DELETE
  TO anon, authenticated
  USING (false);