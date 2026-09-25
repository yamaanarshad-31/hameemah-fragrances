import { desc, like, count } from "drizzle-orm";
import { Card, PageTitle } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { ActionButton } from "@/components/admin/Confirm";
import { removeDemoOrders } from "@/app/actions/admin";
import { getSettings } from "@/lib/data";
import { getDb, schema as s } from "@/lib/db";

export const metadata = { title: "Settings" };

export default async function Settings() {
  const db = await getDb();
  const [settings, [demo], subs] = await Promise.all([
    getSettings(),
    db.select({ n: count() }).from(s.orders).where(like(s.orders.orderNo, "DEMO-%")),
    db.select().from(s.subscribers).orderBy(desc(s.subscribers.createdAt)),
  ]);
  return (
    <>
      <PageTitle title="Settings" sub="Changes go live on the store as soon as you save." />
      <div className="grid grid-cols-1 gap-6 pb-24 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SettingsForm s={settings} />
        <div className="space-y-6">
          {demo.n > 0 && (
            <Card className="border-l-4 !border-l-gold">
              <p className="font-semibold">Demo orders</p>
              <p className="mt-1 text-sm text-muted">{demo.n} sample orders (and sample “sold” counts) were added so the dashboard isn&apos;t empty. Remove them before you go live.</p>
              <ActionButton action={removeDemoOrders} confirmText="Delete all demo orders?" className="mt-4 min-h-11 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-cream">Remove demo orders</ActionButton>
            </Card>
          )}
          <Card>
            <div className="flex items-center justify-between"><p className="font-semibold">Newsletter subscribers</p><span className="rounded-full bg-emerald/10 px-2.5 py-0.5 text-xs font-bold text-emerald">{subs.length}</span></div>
            {subs.length ? (
              <>
                <ul className="mt-3 max-h-64 divide-y divide-black/5 overflow-y-auto text-sm">{subs.map((x) => <li key={x.id} className="flex justify-between py-2"><span className="truncate">{x.email}</span><span className="text-xs text-muted">{new Date(x.createdAt).toLocaleDateString("en-GB")}</span></li>)}</ul>
                <a href="/api/admin/subscribers" className="mt-3 inline-block text-sm font-semibold text-emerald hover:underline">Download CSV</a>
              </>
            ) : <p className="mt-2 text-sm text-muted">No subscribers yet.</p>}
          </Card>
          <Card>
            <p className="font-semibold">Admin login</p>
            <p className="mt-1 text-sm text-muted">Your email and password are set in the server environment (<code>ADMIN_EMAIL</code> / <code>ADMIN_PASSWORD</code>). Change them there before going live.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
