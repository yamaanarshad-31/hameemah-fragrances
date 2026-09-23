import type { Metadata } from "next";
import { PageHero } from "@/components/store/PageHero";
import { WishlistView } from "@/components/store/WishlistView";

export const metadata: Metadata = { title: "Your Wishlist", robots: { index: false } };

export default function Wishlist() {
  return (
    <>
      <PageHero eyebrow="Saved for later" title="Your Wishlist" />
      <div className="mx-auto max-w-7xl px-5 lg:px-8"><WishlistView /></div>
    </>
  );
}
