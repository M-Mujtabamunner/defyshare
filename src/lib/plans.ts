// Plans shown on the site. Limits must match server/plans.js (PLAN_LIMITS).
const MB = 1024 * 1024;

export type PlanId = 'free' | 'plus' | 'pro';

export interface PlanInfo {
  id: PlanId;
  name: string;
  limit: number;
  price: string; // per month
  blurb: string;
  features: string[];
}

export const PLANS: PlanInfo[] = [
  {
    id: 'free',
    name: 'Free',
    limit: 30 * MB,
    price: '$0',
    blurb: 'For quick photos, docs and links.',
    features: ['Files up to 30 MB', 'Any file type & folders', 'Text & link sharing', 'Send to devices or groups'],
  },
  {
    id: 'plus',
    name: 'Plus',
    limit: 500 * MB,
    price: '$2',
    blurb: 'Great for photos, phone videos and documents.',
    features: ['Files up to 500 MB', 'Original quality, never compressed', 'Everything in Free', 'Cancel anytime'],
  },
  {
    id: 'pro',
    name: 'Pro',
    limit: 3 * 1024 * MB,
    price: '$3.50',
    blurb: 'For long 4K videos, RAW photos, big ZIPs and project folders.',
    features: ['Files up to 3 GB', 'Fast parallel uploads', 'Everything in Plus', 'Cancel anytime'],
  },
];

export const planById = (id: PlanId) => PLANS.find((p) => p.id === id) ?? PLANS[0];
export const RANK: Record<PlanId, number> = { free: 0, plus: 1, pro: 2 };

/** Smallest plan that fits a file of this size (null if none does). */
export const planFor = (bytes: number): PlanInfo | null => PLANS.find((p) => bytes <= p.limit) ?? null;

export const formatLimit = (bytes: number) =>
  bytes >= 1024 * MB ? `${+(bytes / (1024 * MB)).toFixed(1)} GB` : `${Math.round(bytes / MB)} MB`;

/** Lemon Squeezy checkout links (Products → Share → copy the checkout link), set in .env / Vercel. */
export const CHECKOUT_URLS: Partial<Record<PlanId, string>> = {
  plus: import.meta.env.VITE_LS_PLUS_URL,
  pro: import.meta.env.VITE_LS_PRO_URL,
};
