// Server-only: works out which plan (free / plus / pro) a request is entitled to.
// Two ways to prove a paid plan:
//   - license: a Lemon Squeezy license key, checked with the public License API
//   - token:   a Supabase access token from Google sign-in; the email is looked up
//              in Lemon Squeezy subscriptions (needs LEMONSQUEEZY_API_KEY)
// Env (Vercel → Settings → Environment Variables, or .env.local for dev):
//   LEMONSQUEEZY_API_KEY     API key (Settings → API) — only needed for sign-in lookup
//   LEMONSQUEEZY_STORE_ID    numeric store id; keys/subscriptions from other stores are rejected
//   LS_PLUS_VARIANT_IDS      comma-separated variant ids that grant Plus (monthly, yearly…)
//   LS_PRO_VARIANT_IDS       comma-separated variant ids that grant Pro
// If the variant ids are not set, the variant/product name is used ("Plus" / "Pro").

const MB = 1024 * 1024;
export const PLAN_LIMITS = { free: 30 * MB, plus: 500 * MB, pro: 3 * 1024 * MB };
const RANK = { free: 0, plus: 1, pro: 2 };

// Public values (also in the client bundle) so the function works without extra env.
const DEFAULT_SUPABASE_URL = 'https://oqnuodlxrbgkhhzxrgnu.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_77X9nyTHiMofs2lHUI4Fig_k0w8KbF8';
const LS_API = 'https://api.lemonsqueezy.com/v1';

const ids = (s) => new Set(String(s || '').split(',').map((x) => x.trim()).filter(Boolean));

const planForVariant = (env, variantId, variantName, productName) => {
  const plus = ids(env.LS_PLUS_VARIANT_IDS);
  const pro = ids(env.LS_PRO_VARIANT_IDS);
  const v = String(variantId ?? '');
  if (pro.has(v)) return 'pro';
  if (plus.has(v)) return 'plus';
  if (plus.size || pro.size) return 'free'; // ids configured and this one isn't listed
  for (const name of [variantName, productName]) {
    const n = String(name || '');
    const isPro = /\bpro\b/i.test(n);
    const isPlus = /\bplus\b/i.test(n);
    if (isPro && !isPlus) return 'pro';
    if (isPlus && !isPro) return 'plus';
  }
  return 'free';
};

const storeOk = (env, storeId) => !env.LEMONSQUEEZY_STORE_ID || String(storeId) === String(env.LEMONSQUEEZY_STORE_ID);

// Small in-memory cache so uploads don't call Lemon Squeezy every time.
const cache = new Map();
const cached = async (key, ttlMs, fn) => {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await fn();
  cache.set(key, { value, expires: Date.now() + (value.plan === 'free' ? Math.min(ttlMs, 60_000) : ttlMs) });
  if (cache.size > 2000) cache.delete(cache.keys().next().value);
  return value;
};

async function planFromLicense(env, licenseKey) {
  return cached(`lic:${licenseKey}`, 10 * 60_000, async () => {
    const res = await fetch(`${LS_API}/licenses/validate`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ license_key: licenseKey }),
    });
    const json = await res.json().catch(() => ({}));
    const lk = json.license_key || {};
    const meta = json.meta || {};
    if (!json.valid || !['active', 'inactive'].includes(lk.status)) {
      return { plan: 'free', error: lk.status === 'expired' ? 'license_expired' : lk.status === 'disabled' ? 'license_disabled' : 'license_invalid' };
    }
    if (!storeOk(env, meta.store_id)) return { plan: 'free', error: 'license_invalid' };
    const plan = planForVariant(env, meta.variant_id, meta.variant_name, meta.product_name);
    return { plan, source: 'license', email: meta.customer_email || null, expiresAt: lk.expires_at || null };
  });
}

async function emailFromToken(env, token) {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_KEY;
  const res = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const user = await res.json().catch(() => null);
  return user?.email ? String(user.email).toLowerCase() : null;
}

const LIVE = ['active', 'on_trial', 'past_due'];

async function planFromEmail(env, email) {
  if (!env.LEMONSQUEEZY_API_KEY) return { plan: 'free' };
  return cached(`sub:${email}`, 5 * 60_000, async () => {
    const q = new URLSearchParams({ 'filter[user_email]': email });
    if (env.LEMONSQUEEZY_STORE_ID) q.set('filter[store_id]', env.LEMONSQUEEZY_STORE_ID);
    const res = await fetch(`${LS_API}/subscriptions?${q}`, {
      headers: { Accept: 'application/vnd.api+json', Authorization: `Bearer ${env.LEMONSQUEEZY_API_KEY}` },
    });
    if (!res.ok) return { plan: 'free' };
    const json = await res.json().catch(() => ({}));
    let best = { plan: 'free' };
    for (const s of json.data || []) {
      const a = s.attributes || {};
      if (!storeOk(env, a.store_id)) continue;
      const live = LIVE.includes(a.status) || (a.status === 'cancelled' && a.ends_at && new Date(a.ends_at) > new Date());
      if (!live) continue;
      const plan = planForVariant(env, a.variant_id, a.variant_name, a.product_name);
      if (RANK[plan] > RANK[best.plan]) {
        best = {
          plan,
          source: 'subscription',
          email,
          renewsAt: a.status === 'cancelled' ? null : a.renews_at || null,
          endsAt: a.ends_at || null,
          portalUrl: a.urls?.customer_portal || null,
        };
      }
    }
    return best;
  });
}

const validLicense = (k) => typeof k === 'string' && /^[\w-]{8,100}$/.test(k.trim());
const validToken = (t) => typeof t === 'string' && t.length > 20 && t.length < 4096;

/** Best plan proven by any of the given credentials. Never throws. */
export async function resolvePlan(auth = {}, env = process.env) {
  const checks = [];
  if (validLicense(auth.license)) checks.push(planFromLicense(env, auth.license.trim()).catch(() => ({ plan: 'free', error: 'license_check_failed' })));
  if (validToken(auth.token)) {
    checks.push(
      emailFromToken(env, auth.token)
        .then((email) => (email ? planFromEmail(env, email).then((r) => ({ ...r, email })) : { plan: 'free' }))
        .catch(() => ({ plan: 'free' })),
    );
  }
  const results = await Promise.all(checks);
  let best = { plan: 'free' };
  for (const r of results) if (RANK[r.plan] > RANK[best.plan] || (r.plan === best.plan && !best.email && r.email)) best = { ...best, ...r };
  const licenseError = results.find((r) => r.error)?.error;
  return { ...best, limit: PLAN_LIMITS[best.plan], ...(licenseError && best.source !== 'license' ? { licenseError } : {}) };
}

/** POST /api/plan body: { token?, license? } */
export async function handlePlanRequest(body, env = process.env) {
  const auth = { token: body?.token, license: body?.license };
  if (body?.refresh) cache.clear(); // right after a purchase or a new key
  return { status: 200, json: await resolvePlan(auth, env) };
}
