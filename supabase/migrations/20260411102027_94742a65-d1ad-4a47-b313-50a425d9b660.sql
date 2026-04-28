
-- Blocked domains table
CREATE TABLE public.blocked_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blocked_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read blocked domains"
  ON public.blocked_domains FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage blocked domains"
  ON public.blocked_domains FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read announcements"
  ON public.announcements FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage announcements"
  ON public.announcements FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.app_settings (key, value) VALUES
  ('auto_play', 'true'),
  ('max_queue_size', '50'),
  ('submission_cooldown_seconds', '30'),
  ('require_approval', 'true'),
  ('site_title', 'SoundCast'),
  ('site_description', 'Submit a music link and it plays on the main speaker.')
ON CONFLICT (key) DO NOTHING;
