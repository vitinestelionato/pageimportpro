
-- Catálogo público de integrações disponíveis
CREATE TABLE public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  auth_type TEXT NOT NULL CHECK (auth_type IN ('oauth2','api_key','bearer','webhook','custom','builtin')),
  icon_url TEXT,
  docs_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_coming_soon BOOLEAN NOT NULL DEFAULT false,
  config_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.integrations TO authenticated, anon;
GRANT ALL ON public.integrations TO service_role;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integrations readable by everyone"
  ON public.integrations FOR SELECT
  USING (true);
CREATE TRIGGER integrations_set_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Conexões do usuário
CREATE TABLE public.user_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_slug TEXT NOT NULL REFERENCES public.integrations(slug) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'disconnected'
    CHECK (status IN ('connected','disconnected','error','pending','revoked')),
  account_label TEXT,
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, integration_slug, account_label)
);
CREATE INDEX user_integrations_user_idx ON public.user_integrations (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_integrations TO authenticated;
GRANT ALL ON public.user_integrations TO service_role;
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user manages own integrations"
  ON public.user_integrations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER user_integrations_set_updated_at
  BEFORE UPDATE ON public.user_integrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Log de eventos de integração
CREATE TABLE public.integration_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_slug TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success','error','info','warning')),
  message TEXT,
  ip_address TEXT,
  duration_ms INT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX integration_events_user_created_idx ON public.integration_events (user_id, created_at DESC);
CREATE INDEX integration_events_slug_idx ON public.integration_events (integration_slug);
GRANT SELECT, INSERT ON public.integration_events TO authenticated;
GRANT ALL ON public.integration_events TO service_role;
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user reads own integration events"
  ON public.integration_events FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "user inserts own integration events"
  ON public.integration_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Seed do catálogo
INSERT INTO public.integrations (slug, name, description, category, auth_type, is_active, is_coming_soon, sort_order) VALUES
  ('cakto',        'Cakto',         'Recebe webhooks de vendas e libera acesso automaticamente.',   'Pagamentos',       'webhook', true,  false, 10),
  ('brevo',        'Brevo',         'Envio de emails transacionais e listas de contato.',           'E-mail',           'api_key', true,  false, 20),
  ('linketrack',   'LinkeTrack',    'Rastreamento de encomendas nacionais e internacionais.',       'Rastreio',         'api_key', true,  false, 30),
  ('firecrawl',    'Firecrawl',     'Extração de dados de páginas de produto e concorrentes.',      'Automação',        'api_key', true,  false, 40),
  ('openai',       'OpenAI',        'Modelos de IA para análise, textos e imagens.',                'IA',               'api_key', true,  true,  50),
  ('shopee',       'Shopee',        'Sincroniza produtos, pedidos e estoque com sua loja Shopee.',  'Marketplace',      'oauth2',  true,  true,  60),
  ('mercadolivre', 'Mercado Livre', 'Anúncios, pedidos e mensagens do Mercado Livre.',              'Marketplace',      'oauth2',  true,  true,  70),
  ('correios',     'Correios',      'Cálculo de frete e emissão de etiquetas.',                     'Transportadora',   'api_key', true,  true,  80),
  ('stripe',       'Stripe',        'Cobranças, assinaturas e recibos.',                            'Pagamentos',       'api_key', true,  true,  90),
  ('whatsapp',     'WhatsApp Cloud','Notificações e atendimento via WhatsApp oficial.',             'Comunicação',      'bearer',  true,  true,  100),
  ('google_ads',   'Google Ads',    'Métricas de campanhas e conversões.',                          'Anúncios',         'oauth2',  true,  true,  110),
  ('meta_ads',     'Meta Ads',      'Campanhas do Facebook e Instagram.',                           'Anúncios',         'oauth2',  true,  true,  120)
ON CONFLICT (slug) DO NOTHING;
