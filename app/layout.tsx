import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Cinzel, Manrope } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal", "italic"] });
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["400", "500", "600"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Fragrances by Hameemah | Luxury Perfumes in Pakistan", template: "%s | Fragrances by Hameemah" },
  description:
    "Shop long-lasting luxury perfumes, oud and attars from Fragrances by Hameemah. Cash on delivery and fast shipping all over Pakistan.",
  applicationName: "Fragrances by Hameemah",
};

export const viewport: Viewport = { themeColor: "#0a2a1c" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${cormorant.variable} ${cinzel.variable} ${manrope.variable} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
