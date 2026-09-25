import { Announcement } from "@/components/store/Announcement";
import { CartProvider } from "@/components/store/cart";
import { CartDrawer } from "@/components/store/CartDrawer";
import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";
import { Intro } from "@/components/store/Intro";
import { SmoothScroll } from "@/components/store/SmoothScroll";
import { WhatsAppButton } from "@/components/store/WhatsAppButton";
import { getCategories, getSettings } from "@/lib/data";
import { BRAND, SITE_URL, STORE_ID, ld } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [settings, cats] = await Promise.all([getSettings(), getCategories()]);
  const categories = cats.map((c) => ({ name: c.name, slug: c.slug }));
  // Placeholder social links (bare domains) are left out until real profiles are set in Admin → Settings.
  const sameAs = [settings.instagram, settings.facebook, settings.tiktok].filter((u) => u && !/^https?:\/\/(www\.)?[^/]+\/?$/.test(u));
  const siteLd = [
    {
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      "@id": STORE_ID,
      name: BRAND,
      alternateName: "Hameemah Fragrances",
      url: SITE_URL,
      logo: `${SITE_URL}/brand/logo-full.png`,
      image: `${SITE_URL}/opengraph-image.jpg`,
      description: "Online perfume house in Pakistan selling long-lasting luxury perfumes, oud and alcohol-free attars with cash on delivery nationwide.",
      email: settings.email,
      telephone: settings.phone,
      address: { "@type": "PostalAddress", addressCountry: "PK" },
      areaServed: { "@type": "Country", name: "Pakistan" },
      currenciesAccepted: "PKR",
      paymentAccepted: "Cash on delivery, Bank transfer, JazzCash, Easypaisa",
      ...(sameAs.length ? { sameAs } : {}),
      contactPoint: { "@type": "ContactPoint", telephone: settings.phone, email: settings.email, contactType: "customer service", areaServed: "PK", availableLanguage: ["English", "Urdu"] },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: BRAND,
      url: SITE_URL,
      inLanguage: "en-PK",
      publisher: { "@id": STORE_ID },
      potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/shop?q={search_term_string}` }, "query-input": "required name=search_term_string" },
    },
  ];
  return (
    <CartProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={ld(siteLd)} />
      <Intro />
      <SmoothScroll />
      <Announcement text={settings.announcement} />
      <Header categories={categories} />
      <main id="main">{children}</main>
      <Footer settings={settings} categories={categories} />
      <CartDrawer freeOver={Number(settings.freeShippingOver) || 0} />
      <WhatsAppButton number={settings.whatsapp} />
    </CartProvider>
  );
}
