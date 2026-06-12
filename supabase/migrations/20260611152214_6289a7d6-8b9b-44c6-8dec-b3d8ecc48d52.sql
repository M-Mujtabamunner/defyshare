
CREATE TABLE public.promo_overrides (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  keep_forever boolean NOT NULL DEFAULT true,
  promo_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_overrides TO authenticated;
GRANT ALL ON public.promo_overrides TO service_role;

ALTER TABLE public.promo_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own override"
  ON public.promo_overrides FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own override"
  ON public.promo_overrides FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own override"
  ON public.promo_overrides FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_promo_overrides()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER promo_overrides_touch
  BEFORE UPDATE ON public.promo_overrides
  FOR EACH ROW EXECUTE FUNCTION public.touch_promo_overrides();
