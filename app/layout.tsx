import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Cinzel, Manrope } from "next/font/google";
import "./globals.css";
import { BRAND, SITE_URL } from "@/lib/site";

const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["400"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND} | Luxury Perfumes in Pakistan`, template: `%s | ${BRAND}` },
  description:
    "Shop long-lasting luxury perfumes, oud and attars from Fragrances by Hameemah. Cash on delivery and fast shipping all over Pakistan.",
  applicationName: BRAND,
  keywords: ["perfume Pakistan", "best perfume in Pakistan", "oud perfume", "attar", "long lasting perfume", "perfume for men", "perfume for women", BRAND],
  // No site-wide canonical: each indexable page sets its own, so noindex pages don't point at the home page.
  openGraph: { type: "website", siteName: BRAND, locale: "en_PK" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
  // Paste the Search Console HTML-tag token into GOOGLE_SITE_VERIFICATION to verify ownership.
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
};

export const viewport: Viewport = { themeColor: "#0a2a1c" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-PK" suppressHydrationWarning className={`${cormorant.variable} ${cinzel.variable} ${manrope.variable} antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem('hf_intro')||matchMedia('(prefers-reduced-motion: reduce)').matches||/[?&]intro=skip/.test(location.search))document.documentElement.classList.add('intro-seen')}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
