-- ============ CATALOG_ITEMS ============
CREATE TABLE public.catalog_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  niche TEXT,
  image_url TEXT,
  origin_country TEXT NOT NULL DEFAULT 'China',
  origin_currency TEXT NOT NULL DEFAULT 'CNY',
  origin_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  suggested_price_brl NUMERIC(12,2) NOT NULL DEFAULT 0,
  margin_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  difficulty TEXT NOT NULL DEFAULT 'facil',
  trend TEXT NOT NULL DEFAULT 'estavel',
  monthly_searches INTEGER NOT NULL DEFAULT 0,
  supplier_url TEXT,
  supplier_platform TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.catalog_items TO authenticated;
GRANT ALL ON public.catalog_items TO service_role;

ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view catalog"
  ON public.catalog_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage catalog"
  ON public.catalog_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER catalog_items_updated_at
  BEFORE UPDATE ON public.catalog_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_catalog_items_category ON public.catalog_items(category);
CREATE INDEX idx_catalog_items_featured ON public.catalog_items(featured) WHERE featured = true;

-- ============ CATALOG_FAVORITES ============
CREATE TABLE public.catalog_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

GRANT SELECT, INSERT, DELETE ON public.catalog_favorites TO authenticated;
GRANT ALL ON public.catalog_favorites TO service_role;

ALTER TABLE public.catalog_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON public.catalog_favorites FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add own favorites"
  ON public.catalog_favorites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own favorites"
  ON public.catalog_favorites FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_catalog_favorites_user ON public.catalog_favorites(user_id);

-- ============ SEED ============
INSERT INTO public.catalog_items
  (name, description, category, niche, image_url, origin_currency, origin_price, suggested_price_brl, margin_pct, difficulty, trend, monthly_searches, supplier_url, supplier_platform, tags, rating, featured)
VALUES
  ('Mini Projetor Portátil HD', 'Projetor compacto com Wi-Fi, ideal para home theater e apresentações. Suporta 1080p e Bluetooth.', 'Eletrônicos', 'Casa Inteligente', 'https://images.unsplash.com/photo-1626379953822-baec19c3accd?w=800', 'CNY', 189.00, 449.90, 138.0, 'medio', 'alta', 74000, 'https://www.aliexpress.com/', 'AliExpress', ARRAY['projetor','home','tech','viral'], 4.7, true),
  ('Fone Bluetooth com Cancelamento de Ruído', 'Fone TWS com ANC ativo, bateria de 30h e case de carregamento sem fio.', 'Eletrônicos', 'Áudio', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800', 'CNY', 52.00, 189.90, 265.0, 'facil', 'alta', 210000, 'https://www.1688.com/', '1688', ARRAY['fone','bluetooth','anc','tech'], 4.8, true),
  ('Luminária LED de Mesa Dobrável', 'Luminária articulada com toque, 3 níveis de brilho e carregamento USB.', 'Casa e Decoração', 'Iluminação', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800', 'CNY', 28.50, 119.90, 320.0, 'facil', 'estavel', 33000, 'https://s.taobao.com/', 'Taobao', ARRAY['luminaria','led','casa'], 4.5, false),
  ('Máquina de Escova Elétrica Facial', 'Escova de silicone para limpeza facial profunda com vibração sônica.', 'Beleza e Cuidados', 'Skincare', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800', 'CNY', 22.00, 89.90, 308.0, 'facil', 'alta', 88000, 'https://www.aliexpress.com/', 'AliExpress', ARRAY['beleza','skincare','viral'], 4.6, true),
  ('Smart Watch Série 9', 'Smartwatch com tela AMOLED, oxímetro, GPS e mais de 100 modos esportivos.', 'Eletrônicos', 'Wearables', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', 'CNY', 78.00, 269.90, 246.0, 'medio', 'alta', 156000, 'https://www.aliexpress.com/', 'AliExpress', ARRAY['smartwatch','tech','fitness'], 4.4, false),
  ('Umidificador Ultrassônico Aromatizador', 'Difusor de essências com LED colorido, silencioso, 300ml.', 'Casa e Decoração', 'Aromaterapia', 'https://images.unsplash.com/photo-1607006677656-95fa32c53c1c?w=800', 'CNY', 18.00, 79.90, 344.0, 'facil', 'estavel', 45000, 'https://www.goofish.com/', 'Goofish', ARRAY['aromaterapia','casa','wellness'], 4.5, false),
  ('Carregador Magnético Sem Fio 3 em 1', 'Base de carga rápida para iPhone, Apple Watch e AirPods simultaneamente.', 'Eletrônicos', 'Acessórios Apple', 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800', 'CNY', 65.00, 249.90, 284.0, 'medio', 'alta', 98000, 'https://www.1688.com/', '1688', ARRAY['carregador','apple','tech'], 4.7, true),
  ('Câmera de Segurança Wi-Fi 360º', 'Câmera IP com visão noturna, áudio bidirecional e detecção de movimento.', 'Segurança', 'Casa Inteligente', 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800', 'CNY', 42.00, 169.90, 305.0, 'medio', 'estavel', 62000, 'https://www.aliexpress.com/', 'AliExpress', ARRAY['camera','seguranca','iot'], 4.5, false),
  ('Massageador de Pescoço Elétrico', 'Massageador shiatsu portátil com aquecimento e 6 modos.', 'Saúde e Bem-Estar', 'Bem-Estar', 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800', 'CNY', 35.00, 139.90, 300.0, 'facil', 'alta', 71000, 'https://www.goofish.com/', 'Goofish', ARRAY['massagem','saude','viral'], 4.6, false),
  ('Mochila Antifurto USB', 'Mochila impermeável com carregador USB, cadeado e compartimento para notebook 15".', 'Moda e Acessórios', 'Bolsas', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', 'CNY', 48.00, 189.90, 296.0, 'facil', 'estavel', 54000, 'https://www.aliexpress.com/', 'AliExpress', ARRAY['mochila','moda','usb'], 4.4, false),
  ('Kit Ferramentas Precisão 115 peças', 'Kit multiferramenta ideal para eletrônicos, celulares e relógios.', 'Ferramentas', 'DIY', 'https://images.unsplash.com/photo-1581147036324-c1c88bb6ee78?w=800', 'CNY', 55.00, 219.90, 300.0, 'medio', 'estavel', 28000, 'https://www.1688.com/', '1688', ARRAY['ferramenta','diy','tech'], 4.7, false),
  ('Ring Light 10" com Tripé', 'Iluminador circular com controle e tripé de 2m para lives e fotos.', 'Fotografia', 'Criadores', 'https://images.unsplash.com/photo-1608889476561-6242cfdbf622?w=800', 'CNY', 32.00, 149.90, 368.0, 'facil', 'alta', 112000, 'https://www.aliexpress.com/', 'AliExpress', ARRAY['ringlight','foto','criador'], 4.6, true);
