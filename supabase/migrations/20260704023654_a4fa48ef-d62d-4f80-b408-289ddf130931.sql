CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('price_target','price_drop','exchange_rate','stock_low','shipment_update','custom_reminder')),
  title text NOT NULL,
  description text,
  target_value numeric,
  current_value numeric,
  comparison text CHECK (comparison IN ('lt','gt','eq','lte','gte')),
  reference_url text,
  reference_label text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','triggered')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  notify_email boolean NOT NULL DEFAULT false,
  notify_in_app boolean NOT NULL DEFAULT true,
  trigger_count integer NOT NULL DEFAULT 0,
  last_checked_at timestamptz,
  last_triggered_at timestamptz,
  due_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_alerts_select" ON public.alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_alerts_insert" ON public.alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_alerts_update" ON public.alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_alerts_delete" ON public.alerts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_alerts_updated_at BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_alerts_user_status ON public.alerts(user_id, status, updated_at DESC);
CREATE INDEX idx_alerts_due ON public.alerts(user_id, due_at) WHERE due_at IS NOT NULL;