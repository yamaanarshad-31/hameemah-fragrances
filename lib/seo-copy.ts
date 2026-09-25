/**
 * Search-focused titles and intro copy for the shop and collection pages.
 * Keyed by category slug; categories added later in Admin fall back to a generic version.
 */
export type SeoCopy = { title: string; description: string; heading: string; body: string[] };

export const SHOP_COPY: SeoCopy = {
  title: "Buy Perfumes Online in Pakistan",
  description: "Shop long-lasting perfumes for men and women online in Pakistan. Small-batch luxury Eau de Parfums in 50ml and 100ml with cash on delivery nationwide.",
  heading: "Long-lasting perfumes, delivered across Pakistan",
  body: [
    "Fragrances by Hameemah is an online perfume house for Pakistan. Every scent is blended in small batches with high-concentration oils, so an Eau de Parfum from us is made to last through a full working day — and our Extraits last longer still.",
    "Browse fresh everyday perfumes for men, soft florals for women and warm unisex scents, each in 50ml and 100ml bottles. Order online and pay cash on delivery in Karachi, Lahore, Islamabad and every other city, or pay in advance by bank transfer, JazzCash or Easypaisa.",
  ],
};

const CATEGORY_COPY: Record<string, SeoCopy> = {
  men: {
    title: "Perfumes for Men in Pakistan",
    description: "Long-lasting perfumes for men in Pakistan — fresh citrus, aquatic, woody and smoky leather scents. Cash on delivery and fast shipping nationwide.",
    heading: "Men's perfumes that last all day",
    body: [
      "Our men's collection covers every mood: crisp citrus and aquatic scents for hot Pakistani summers and the office, green vetiver for evenings out, and bold smoky leather for when you want to be noticed.",
      "Each perfume is an Eau de Parfum with high oil concentration for better longevity and projection. Choose 50ml for everyday wear or 100ml for your signature — all delivered with cash on delivery across Pakistan.",
    ],
  },
  women: {
    title: "Perfumes for Women in Pakistan",
    description: "Long-lasting perfumes for women in Pakistan — rose, jasmine, soft musk and floral scents. Order online with cash on delivery all over Pakistan.",
    heading: "Women's perfumes, soft to unforgettable",
    body: [
      "From a velvet Damask rose to night-blooming jasmine and clean skin musk, our women's perfumes are made to be worn every day and remembered long after you've left the room.",
      "Every bottle is blended in small batches with premium oils for lasting wear. Order online and pay cash on delivery anywhere in Pakistan.",
    ],
  },
  unisex: {
    title: "Unisex Perfumes in Pakistan",
    description: "Unisex perfumes made to be shared — warm amber, saffron and leather scents that last. Cash on delivery across Pakistan.",
    heading: "Unisex scents made to be shared",
    body: [
      "Our unisex perfumes sit between fresh and oriental: golden amber with honeyed spice, and saffron with supple leather and smooth sandalwood. They suit anyone who loves a rich, long-lasting scent.",
      "Start with a 50ml bottle or go straight to 100ml for the best value per ml. Delivered to your door in 2–4 working days anywhere in Pakistan.",
    ],
  },
};

export function categoryCopy(c: { slug: string; name: string; blurb: string | null }): SeoCopy {
  return (
    CATEGORY_COPY[c.slug] ?? {
      title: `${c.name} Perfumes in Pakistan`,
      description: `Shop ${c.name} perfumes from Fragrances by Hameemah${c.blurb ? ` — ${c.blurb.toLowerCase()}` : ""}. Long-lasting scents with cash on delivery all over Pakistan.`,
      heading: `${c.name}, made to last`,
      body: [`Discover our ${c.name.toLowerCase()} collection — blended in small batches with premium oils and delivered with cash on delivery anywhere in Pakistan.`],
    }
  );
}
