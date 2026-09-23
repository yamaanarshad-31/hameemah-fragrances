# Fragrances by Hameemah

Animated perfume store + admin panel. Next.js 16, React 19, Tailwind 4, Motion, Lenis, Drizzle ORM on SQLite/libSQL.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3014
```

- Store: http://localhost:3014
- Admin: http://localhost:3014/admin  (login from `.env.local`: `ADMIN_EMAIL` / `ADMIN_PASSWORD`)

The database is created automatically at `data/store.db` on first run, with starter products,
categories, reviews, a `WELCOME10` coupon and **18 demo orders** (remove them in Admin → Settings).

## What the admin can do

- **Products:** add, edit or delete products; upload photos; set sizes, prices, sale prices and stock; add scent notes; choose which products are featured, bestsellers or new.
- **Orders:** see every order, filter and search them, and move each one through pending → confirmed → shipped → delivered or cancelled. Cancelling an order puts its stock back. You can also WhatsApp or call the customer and print a slip.
- **Categories and coupons.**
- **Reviews:** approve customer reviews before they appear on the store.
- **Settings:** announcement bar, hero text, contact details and social links, delivery fee and free-delivery limit, bank details. You can also export newsletter subscribers.

## Deploy (Vercel + Turso)

1. Create a free Turso database: `turso db create hameemah` → copy its URL and a token.
2. Push this folder to GitHub → import in Vercel.
3. Add these environment variables in Vercel:
   - `DATABASE_URL`: the `libsql://…` URL
   - `DATABASE_AUTH_TOKEN`: the token
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`: pick a strong password
   - `ADMIN_SECRET`: any long random string
   - `NEXT_PUBLIC_SITE_URL`: `https://your-domain.com`
4. Deploy. The tables and starter data are created on the first request.

Uploaded photos are stored in the database, so no extra storage service is needed.

## SEO included

- Per-page titles, descriptions and canonical URLs.
- Open Graph and Twitter images.
- JSON-LD: Organization, WebSite, FAQ, Product (with offers and ratings) and breadcrumbs.
- `/sitemap.xml` (built from the database), `/robots.txt`, `/manifest.webmanifest` and `/llms.txt`.
