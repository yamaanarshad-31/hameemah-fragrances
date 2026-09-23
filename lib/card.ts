import type { ProductWithRating } from "./data";

/** Trim a product down to what cards need before it crosses to the client. */
export const toCard = (p: ProductWithRating) => ({
  id: p.id, name: p.name, slug: p.slug, tagline: p.tagline, variants: p.variants, images: p.images,
  color: p.color, shape: p.shape, rating: p.rating, reviewCount: p.reviewCount, isNew: p.isNew, bestseller: p.bestseller,
  categoryName: p.categoryName,
});
