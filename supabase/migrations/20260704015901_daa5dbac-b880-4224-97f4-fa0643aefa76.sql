CREATE TABLE public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  tracking_code TEXT NOT NULL,
  carrier TEXT NOT NULL DEFAULT 'desconhecido',
  status TEXT NOT NULL DEFAULT 'pendente',
  last_event_description TEXT,
  last_event_at TIMESTAMPTZ,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX shipments_user_code_unique ON public.shipments (user_id, tracking_code);
CREATE INDEX shipments_user_created_idx ON public.shipments (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipments TO authenticated;
GRANT ALL ON public.shipments TO service_role;

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shipments_select_own" ON public.shipments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "shipments_insert_own" ON public.shipments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shipments_update_own" ON public.shipments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shipments_delete_own" ON public.shipments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER set_shipments_updated_at BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
