
-- Add unique constraint on key column for upsert support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_settings_key_unique'
  ) THEN
    ALTER TABLE public.app_settings ADD CONSTRAINT app_settings_key_unique UNIQUE (key);
  END IF;
END $$;

-- Ensure default settings exist
INSERT INTO public.app_settings (key, value) VALUES
  ('auto_play', 'false'),
  ('require_approval', 'false'),
  ('max_queue_size', '50'),
  ('submission_cooldown_seconds', '30'),
  ('site_title', 'SoundCast'),
  ('site_description', 'Submit a music link and it plays on the main speaker.')
ON CONFLICT (key) DO NOTHING;
