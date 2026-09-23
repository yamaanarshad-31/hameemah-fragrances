"use client";
import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReview } from "@/app/actions/public";

export function ReviewForm({ productId }: { productId: number }) {
  const [state, action, pending] = useActionState(submitReview, null);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  if (state?.ok) return <p className="rounded-3xl bg-emerald p-6 text-center font-display text-2xl text-cream">{state.msg}</p>;
  return (
    <form action={action} className="space-y-4 rounded-3xl border border-ink/10 bg-white p-6">
      <p className="font-display text-2xl">Write a review</p>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((k) => (
          <button type="button" key={k} role="radio" aria-checked={rating === k} aria-label={`${k} star${k > 1 ? "s" : ""}`} onMouseEnter={() => setHover(k)} onClick={() => setRating(k)}>
            <Star className={`size-7 transition ${k <= (hover || rating) ? "fill-gold text-gold" : "text-ink/20"}`} />
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" required minLength={2} maxLength={60} placeholder="Your name" aria-label="Your name" className="rounded-xl border border-ink/15 px-4 py-3 focus:border-emerald focus:outline-none" />
        <input name="city" maxLength={40} placeholder="City (optional)" aria-label="City" className="rounded-xl border border-ink/15 px-4 py-3 focus:border-emerald focus:outline-none" />
      </div>
      <textarea name="body" required minLength={5} maxLength={800} rows={3} placeholder="How does it smell? How long does it last?" aria-label="Your review" className="w-full rounded-xl border border-ink/15 px-4 py-3 focus:border-emerald focus:outline-none" />
      {state && !state.ok && <p className="text-sm text-red-700">{state.msg}</p>}
      <button disabled={pending} className="rounded-full bg-emerald px-7 py-3 text-sm font-bold uppercase tracking-[0.18em] text-cream hover:bg-emerald-2 disabled:opacity-60">{pending ? "Sending…" : "Submit review"}</button>
    </form>
  );
}
