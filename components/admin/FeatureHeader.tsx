import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Feature } from "@/lib/data";
import { FeatureToggle } from "./FeatureToggle";
import { Card } from "./ui";

/** Top of each feature's page: back link, title and the feature's ON/OFF switch. */
export function FeatureHeader({ feature, on, title, sub, offNote }: { feature: Feature; on: boolean; title: string; sub: string; offNote: string }) {
  return (
    <>
      <Link href="/admin/features" className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="size-4" /> Store Features</Link>
      <h1 className="break-words font-display text-[2.1rem] font-semibold leading-tight sm:text-5xl">{title}</h1>
      <p className="mt-1 text-sm text-muted">{sub}</p>
      <Card className={`mb-6 mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-l-4 ${on ? "!border-l-emerald-600" : "!border-l-black/20"}`}>
        <div className="min-w-0">
          <p className="font-semibold">{title} is {on ? "ON" : "OFF"}</p>
          <p className="text-sm text-muted">{on ? "Customers can see it on the website right now." : offNote}</p>
        </div>
        <FeatureToggle feature={feature} on={on} name={title} />
      </Card>
    </>
  );
}
