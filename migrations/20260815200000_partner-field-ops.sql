-- Partner subscriptions, pub settings, rewards, coupon claims, field visits

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IS NULL OR role IN ('fan', 'admin', 'partner'));

CREATE TABLE IF NOT EXISTS public.partner_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('inactive', 'active', 'past_due', 'canceled', 'trialing')),
  current_period_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pub_partner_settings (
  pub_id TEXT PRIMARY KEY REFERENCES public.pubs(id) ON DELETE CASCADE,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  coupons_per_day INTEGER NOT NULL DEFAULT 20 CHECK (coupons_per_day >= 0),
  screening_match_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  screening_label TEXT,
  is_live BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pub_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pub_id TEXT NOT NULL REFERENCES public.pubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '$5',
  description TEXT NOT NULL DEFAULT '',
  requirement TEXT NOT NULL DEFAULT 'Eligible LocalDerby fan',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coupon_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pub_id TEXT NOT NULL REFERENCES public.pubs(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.pub_rewards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'issued'
    CHECK (status IN ('issued', 'redeemed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.field_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_name TEXT NOT NULL,
  worker_email TEXT,
  pub_name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  neighborhood TEXT NOT NULL DEFAULT '',
  contact_name TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  outcome TEXT NOT NULL DEFAULT 'follow_up'
    CHECK (outcome IN ('interested', 'not_interested', 'follow_up')),
  notes TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'rejected', 'needs_follow_up')),
  pioneer_json JSONB,
  created_pub_id TEXT REFERENCES public.pubs(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_pub_rewards_pub ON public.pub_rewards(pub_id);
CREATE INDEX IF NOT EXISTS idx_coupon_claims_pub_day ON public.coupon_claims(pub_id, created_at);
CREATE INDEX IF NOT EXISTS idx_coupon_claims_token ON public.coupon_claims(token);
CREATE INDEX IF NOT EXISTS idx_field_visits_status ON public.field_visits(status, created_at DESC);

ALTER TABLE public.partner_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pub_partner_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pub_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_visits ENABLE ROW LEVEL SECURITY;

-- Readable by authenticated; writes mostly via service/admin for hackathon
DROP POLICY IF EXISTS partner_subs_select_own ON public.partner_subscriptions;
CREATE POLICY partner_subs_select_own ON public.partner_subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS pub_settings_select ON public.pub_partner_settings;
CREATE POLICY pub_settings_select ON public.pub_partner_settings
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS pub_rewards_select ON public.pub_rewards;
CREATE POLICY pub_rewards_select ON public.pub_rewards
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS coupon_claims_select_own ON public.coupon_claims;
CREATE POLICY coupon_claims_select_own ON public.coupon_claims
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS field_visits_select_admin ON public.field_visits;
CREATE POLICY field_visits_select_admin ON public.field_visits
  FOR SELECT TO authenticated
  USING (public.is_admin());
