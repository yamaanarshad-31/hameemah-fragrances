import type { Metadata } from "next";
import { Clock, Mail, MessageCircle, Phone } from "lucide-react";
import { PageHero } from "@/components/store/PageHero";
import { Reveal } from "@/components/store/Reveal";
import { getSettings } from "@/lib/data";
import { pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({ title: "Contact Us", description: "Questions about a perfume or your order? Reach Fragrances by Hameemah on WhatsApp, phone or email — Mon–Sat, 11am to 9pm.", path: "/contact" });

export default async function Contact() {
  const s = await getSettings();
  const cards = [
    { I: MessageCircle, t: "WhatsApp", d: "Fastest way to reach us", v: s.phone, href: `https://wa.me/${s.whatsapp}` },
    { I: Phone, t: "Call us", d: "Mon–Sat, 11am – 9pm", v: s.phone, href: `tel:${s.phone.replace(/\s/g, "")}` },
    { I: Mail, t: "Email", d: "We reply within a day", v: s.email, href: `mailto:${s.email}` },
  ];
  return (
    <>
      <PageHero eyebrow="We're here to help" title="Get in touch" sub="Need help choosing a scent or checking on an order? Message us any time." />
      <div className="mx-auto grid max-w-5xl gap-5 px-5 py-20 md:grid-cols-3">
        {cards.map(({ I, t, d, v, href }, i) => (
          <Reveal key={t} delay={i * 0.1}>
            <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="group block h-full rounded-[2rem] bg-white p-8 shadow-[0_30px_70px_-45px_rgba(6,20,13,.6)] transition hover:-translate-y-1">
              <span className="flex size-14 items-center justify-center rounded-full bg-emerald text-gold transition group-hover:scale-110"><I className="size-6" /></span>
              <p className="mt-6 font-display text-3xl">{t}</p>
              <p className="text-sm text-muted">{d}</p>
              <p className="mt-4 break-all font-semibold text-emerald">{v}</p>
            </a>
          </Reveal>
        ))}
      </div>
      <p className="-mt-8 mb-20 flex items-center justify-center gap-2 text-sm text-muted"><Clock className="size-4" /> Orders placed after 6pm are dispatched the next working day.</p>
    </>
  );
}
