import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { Newsletter } from "./Newsletter";
import type { Settings } from "@/lib/data";

function Social({ href, label, d }: { href: string; label: string; d: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex size-10 items-center justify-center rounded-full border border-gold/30 text-gold-2 transition hover:-translate-y-1 hover:border-gold hover:bg-gold hover:text-ink">
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d={d} /></svg>
    </a>
  );
}

export function Footer({ settings, categories }: { settings: Settings; categories: { name: string; slug: string }[] }) {
  return (
    <footer className="grain relative overflow-hidden bg-ink text-cream">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-emerald/60 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-20 lg:px-8">
        <div className="flex flex-col items-center gap-6 border-b border-gold/15 pb-14 text-center">
          <p className="eyebrow text-gold">The Inner Circle</p>
          <h2 className="max-w-2xl font-display text-4xl leading-tight sm:text-5xl">Early access to new launches & members-only offers</h2>
          <Newsletter />
        </div>

        <div className="grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Image src="/brand/logo-full.png" alt="Fragrances by Hameemah" width={160} height={176} className="h-36 w-auto" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream/60">Luxury, long-lasting perfumes and attars — blended with love and delivered across Pakistan.</p>
            <div className="mt-6 flex gap-3">
              <Social href={settings.instagram} label="Instagram" d="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zM12 7a5 5 0 100 10 5 5 0 000-10zm0 8.2a3.2 3.2 0 110-6.4 3.2 3.2 0 010 6.4zm5.2-9.6a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z" />
              <Social href={settings.facebook} label="Facebook" d="M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.2C16.7 2.2 15.6 2 14.3 2 11.6 2 10 3.6 10 6.6v1.9H7v3.6h3V22h4v-9.9h3l.5-3.6H14z" />
              <Social href={settings.tiktok} label="TikTok" d="M16.6 5.8A4.3 4.3 0 0115.5 3h-3.1v12.4a2.6 2.6 0 11-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.8 5.8 0 105 5.7V9.1a7.4 7.4 0 004.3 1.4V7.4a4.3 4.3 0 01-3.3-1.6z" />
            </div>
          </div>
          <div>
            <p className="eyebrow mb-5 text-gold">Shop</p>
            <ul className="space-y-3 text-sm text-cream/70">
              <li><Link className="hover:text-gold-2" href="/shop">All Perfumes</Link></li>
              {categories.map((c) => <li key={c.slug}><Link className="hover:text-gold-2" href={`/collections/${c.slug}`}>{c.name}</Link></li>)}
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-5 text-gold">Help</p>
            <ul className="space-y-3 text-sm text-cream/70">
              <li><Link className="hover:text-gold-2" href="/track-order">Track your order</Link></li>
              <li><Link className="hover:text-gold-2" href="/policies#shipping">Shipping & delivery</Link></li>
              <li><Link className="hover:text-gold-2" href="/policies#returns">Returns & exchange</Link></li>
              <li><Link className="hover:text-gold-2" href="/policies#privacy">Privacy policy</Link></li>
              <li><Link className="hover:text-gold-2" href="/about">Our story</Link></li>
              <li><Link className="hover:text-gold-2" href="/contact">Contact us</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-5 text-gold">Get in touch</p>
            <ul className="space-y-4 text-sm text-cream/70">
              <li className="flex gap-3"><Phone className="size-4 shrink-0 text-gold" /><a href={`https://wa.me/${settings.whatsapp}`} className="hover:text-gold-2">{settings.phone} (WhatsApp)</a></li>
              <li className="flex gap-3"><Mail className="size-4 shrink-0 text-gold" /><a href={`mailto:${settings.email}`} className="break-all hover:text-gold-2">{settings.email}</a></li>
              <li className="flex gap-3"><MapPin className="size-4 shrink-0 text-gold" />Delivering all over {settings.city}</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-2 text-[0.65rem] font-semibold uppercase tracking-wider">
              {["Cash on Delivery", "Bank Transfer", "JazzCash", "Easypaisa"].map((m) => (
                <span key={m} className="rounded border border-gold/25 px-2 py-1 text-gold-2/80">{m}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-gold/15 pt-8 text-xs text-cream/40 sm:flex-row">
          <p>© {new Date().getFullYear()} Fragrances by Hameemah. All rights reserved.</p>
          <p className="font-caps tracking-[0.3em] text-gold/60">Crafted with passion</p>
        </div>
      </div>
    </footer>
  );
}
