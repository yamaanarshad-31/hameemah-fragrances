// Shared by the server (which decides what is charged) and the browser (which shows the same numbers).
import type { Variant } from "./db/schema";

/** Dates typed in Admin are plain days ("2026-10-31") and mean Pakistan time, whatever clock the server runs on. */
const PKT = "+05:00";
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export const cleanDay = (v: unknown) => (typeof v === "string" && DAY.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00${PKT}`)) ? v : "");

/** True from the first minute of `start` to the last minute of `end`; an empty side is open-ended. */
export function inWindow(start?: string | null, end?: string | null, now = Date.now()) {
  if (start && DAY.test(start) && now < Date.parse(`${start}T00:00:00${PKT}`)) return false;
  if (end && DAY.test(end) && now > Date.parse(`${end}T23:59:59.999${PKT}`)) return false;
  return true;
}

export type WindowState = "none" | "scheduled" | "live" | "ended";
export function windowState(start?: string | null, end?: string | null, now = Date.now()): WindowState {
  if (!start && !end) return "none";
  if (start && DAY.test(start) && now < Date.parse(`${start}T00:00:00${PKT}`)) return "scheduled";
  if (end && DAY.test(end) && now > Date.parse(`${end}T23:59:59.999${PKT}`)) return "ended";
  return "live";
}

export const showDay = (v?: string | null) => (v && DAY.test(v) ? new Date(`${v}T12:00:00${PKT}`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" }) : "");

type SaleFields = { variants: Variant[]; salePercent?: number | null; saleStart?: string | null; saleEnd?: string | null };

/** A product has a sale set up when it has a % off or at least one size with a lower sale price. */
export function hasSale(p: SaleFields) {
  return (p.salePercent ?? 0) > 0 || p.variants.some((v) => v.salePrice != null && v.salePrice < v.price);
}

/** What one size costs right now, and what it cost before (null when it isn't discounted). */
export function variantPrice(p: SaleFields, v: Variant, saleOn: boolean, now = Date.now()) {
  if (saleOn && inWindow(p.saleStart, p.saleEnd, now)) {
    const pct = Math.min(90, Math.max(0, p.salePercent ?? 0));
    const sale = pct > 0 ? Math.round((v.price * (100 - pct)) / 100) : v.salePrice ?? null;
    if (sale != null && sale >= 0 && sale < v.price) return { price: sale, compareAt: v.price };
  }
  return { price: v.price, compareAt: null };
}

/**
 * The variants as the store shows and charges them: `price` is what the shopper pays,
 * `compareAt` the crossed-out regular price. With the Sale feature off every size is at its regular price.
 */
export function pricedVariants(p: SaleFields, saleOn: boolean, now = Date.now()): Variant[] {
  return p.variants.map((v) => ({ size: v.size, stock: v.stock, ...variantPrice(p, v, saleOn, now) }));
}

export type CouponTerms = { percent: number; fixed: number };
/** Rupees a coupon takes off a subtotal: a fixed amount never exceeds the subtotal. */
export function couponDiscount(c: CouponTerms, subtotal: number) {
  if (c.fixed > 0) return Math.min(c.fixed, subtotal);
  return Math.round((subtotal * c.percent) / 100);
}
export const couponLabel = (c: CouponTerms) => (c.fixed > 0 ? `Rs. ${c.fixed.toLocaleString("en-PK")} off` : `${c.percent}% off`);

/** Gift sets sit in the bag next to perfumes; a negative id and this size label keep the two apart. */
export const GIFT_SIZE = "Gift set";
export const giftLineId = (giftId: number) => -giftId;
