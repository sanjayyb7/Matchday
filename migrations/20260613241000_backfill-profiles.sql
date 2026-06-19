-- Backfill profiles for auth.users created before the trigger ran

INSERT INTO public.profiles (id, display_name, avatar_url, fan_since, role)
SELECT
  u.id,
  COALESCE(u.profile->>'name', split_part(u.email, '@', 1), 'Fan'),
  u.profile->>'avatar_url',
  COALESCE(u.created_at, NOW()),
  'fan'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
