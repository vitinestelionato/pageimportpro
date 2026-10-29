-- Security hardening for the independent ImportPro build.
-- Authenticated users may edit only their own profile's public contact fields.
-- Plan, status, provider and subscription dates remain server-managed.
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone) ON TABLE public.profiles TO authenticated;

-- A processed payment event must not be recorded twice.
-- Existing duplicates, if any, must be reviewed before applying this index.
CREATE UNIQUE INDEX IF NOT EXISTS webhook_logs_cakto_processed_external_id_uidx
  ON public.webhook_logs (provider, external_id)
  WHERE provider = 'cakto'
    AND status = 'processed'
    AND external_id IS NOT NULL;
