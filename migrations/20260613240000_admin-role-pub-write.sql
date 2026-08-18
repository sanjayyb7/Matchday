-- Admin role on profiles + admin-only pub writes

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'fan'
  CHECK (role IN ('fan', 'admin'));

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (
    id = (SELECT auth.uid())
    AND role = (
      SELECT p.role
      FROM public.profiles AS p
      WHERE p.id = (SELECT auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, fan_since, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.profile->>'name', split_part(NEW.email, '@', 1), 'Fan'),
    NEW.profile->>'avatar_url',
    COALESCE(NEW.created_at, NOW()),
    'fan'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY pubs_admin_insert ON public.pubs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY pubs_admin_update ON public.pubs
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY pubs_admin_delete ON public.pubs
  FOR DELETE TO authenticated
  USING (public.is_admin());
