import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Product photos are served from /api/img, so that one API path must stay crawlable for Google Images and rich results.
        allow: ["/", "/api/img/"],
        disallow: ["/admin", "/api/", "/checkout", "/cart", "/order/", "/wishlist"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
