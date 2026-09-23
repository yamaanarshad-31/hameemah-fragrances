export const rs = (n: number) => "Rs. " + Math.round(n).toLocaleString("en-PK");

export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
export type Status = (typeof STATUSES)[number];

export function minPrice(variants: { price: number; compareAt?: number | null }[]) {
  const v = [...variants].sort((a, b) => a.price - b.price)[0];
  return v ?? { price: 0, compareAt: null };
}

export function discountPct(price: number, compareAt?: number | null) {
  return compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;
}
