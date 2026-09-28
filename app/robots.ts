import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Search and AI answer engines (ChatGPT, Claude, Perplexity, Gemini) may read the shop, same rules as everyone.
        userAgent: ["*", "Googlebot", "Bingbot", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Applebot-Extended"],
        // Product photos are served from /api/img, so that one API path must stay crawlable for Google Images and rich results.
        allow: ["/", "/api/img/"],
        disallow: ["/admin", "/api/", "/checkout", "/cart", "/order/", "/wishlist"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
