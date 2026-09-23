import { Announcement } from "@/components/store/Announcement";
import { CartProvider } from "@/components/store/cart";
import { CartDrawer } from "@/components/store/CartDrawer";
import { Footer } from "@/components/store/Footer";
import { Header } from "@/components/store/Header";
import { Intro } from "@/components/store/Intro";
import { SmoothScroll } from "@/components/store/SmoothScroll";
import { WhatsAppButton } from "@/components/store/WhatsAppButton";
import { getCategories, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [settings, cats] = await Promise.all([getSettings(), getCategories()]);
  const categories = cats.map((c) => ({ name: c.name, slug: c.slug }));
  return (
    <CartProvider>
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
