
-- Metadados extra para o Connector Manager
ALTER TABLE public.integrations
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS version text NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS supported_events text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS lifecycle_status text NOT NULL DEFAULT 'stable';

-- Saúde e sync na conexão do usuário
ALTER TABLE public.user_integrations
  ADD COLUMN IF NOT EXISTS health_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS last_test_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_test_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS avg_response_ms integer,
  ADD COLUMN IF NOT EXISTS error_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sync_mode text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS sync_interval_minutes integer;

-- Fila de sincronizações
CREATE TABLE IF NOT EXISTS public.sync_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES public.user_integrations(id) ON DELETE CASCADE,
  integration_slug text NOT NULL REFERENCES public.integrations(slug) ON DELETE CASCADE,
  job_type text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'queued',
  started_at timestamptz,
  finished_at timestamptz,
  duration_ms integer,
  items_processed integer NOT NULL DEFAULT 0,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_user ON public.sync_jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_conn ON public.sync_jobs(connection_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sync_jobs TO authenticated;
GRANT ALL ON public.sync_jobs TO service_role;

ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sync jobs"
  ON public.sync_jobs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_sync_jobs_updated_at
  BEFORE UPDATE ON public.sync_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Popular metadados nos conectores existentes (best-effort, não falha se coluna faltar)
UPDATE public.integrations SET provider = COALESCE(provider, name) WHERE provider IS NULL;
