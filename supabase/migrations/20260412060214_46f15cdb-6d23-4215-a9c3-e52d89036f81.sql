ALTER TABLE public.queue_submissions
  ADD COLUMN IF NOT EXISTS thumbnail text,
  ADD COLUMN IF NOT EXISTS duration_seconds integer;