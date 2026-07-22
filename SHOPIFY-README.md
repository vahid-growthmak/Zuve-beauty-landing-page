# ZUVE Beauty — Shopify port

The static storefront has been ported to a native Shopify Liquid theme following
`NEXTJS-TO-SHOPIFY-MIGRATION-GUIDE.md`. The original HTML is untouched and still
serves as the design reference.

```
shopify-theme/          ← the deployable theme
data/                   ← the content that has to live in Shopify (products, pages, menus…)
scripts/
  extract-pages.js      ← static HTML → data/pages/*.html (already run)
  seed-shopify.js       ← pushes data/ into a store over the Admin API
```

---

## What maps to what

| Static file | Shopify |
|---|---|
| `index.html` | `templates/index.json` → 8 sections (`hero-dual`, `featured-drop`, 2× `collection-grid`, `ritual-story`, `trust-grid`, `ugc-gallery`, `ritual-club`) |
| `product.html?shade=x`, `products/x.html` | `templates/product.json` → `/products/x` |
| `#soft-muse`, `#dark-siren` anchors | Collections `/collections/soft-muse`, `/collections/dark-siren` |
| `journal.html` | Blog `/blogs/journal` |
| `about/faq/contact/shipping/refund/privacy/terms/sitemap/size-guide/how-to-apply/comparison/track-order` | Pages `/pages/<handle>` |
| `assets/js/product.js` `PRODUCTS` object | Products + `custom.*` metafields |
| Nav / footer link lists | Navigation menus (`main-menu`, `footer-*`) |
| CSS custom properties in `:root` | Theme settings → re-injected into `:root` by `layout/theme.liquid` |

`assets/css/styles.css` ships verbatim as `assets/base.css`; `pdp.css` likewise.
Everything Shopify adds that the static site never had — cart drawer, cart page,
facets, pagination, search, account, password — lives in `assets/theme.css` and
reuses the same tokens. No build step.

### Product metafields (`custom` namespace)

`palette` (`soft`|`dark`, drives the whole colour system), `shade_number`,
`finish`, `undertone`, `wear`, `shade_hex`, `shade_deep_hex`, `badge`, `tagline`,
`story`, `mood`, `pair_with`, `editorial_review`, `rating`, `rating_count`,
`pairs` (`list.product_reference`), `reviews` (`list.metaobject_reference` →
`review` metaobject).

Collections carry `custom.palette`. Pages carry `custom.lede` and
`custom.display_title` (the static pages' hero copy, e.g. *"A ritual, not a
routine."*, which is not the same string as the page's nav title).

---

## Deploying

### 1. Theme

```bash
npm i -g @shopify/cli
shopify theme push --path shopify-theme --unpublished --store <store>.myshopify.com
```

Or connect the repo under **Online Store → Themes → Add theme → Connect from GitHub**.
The GitHub sync is **bidirectional** — pick one source of truth. Edit code in Git;
use the Theme Editor for content and settings only.

### 2. Data

Create a **store-admin custom app** (`Settings → Apps → Develop apps`), not a
Partner-dashboard app. Scopes: `write_products, read_products, write_inventory,
read_inventory, read_locations, write_files, write_publications,
write_online_store_pages, write_online_store_navigation, write_content`.
Install it and reveal the `shpat_…` token.

```bash
cp .env.example .env      # fill in, it's gitignored
node scripts/seed-shopify.js --dry-run
node scripts/seed-shopify.js
```

The seeder is idempotent and step-scoped:

```bash
node scripts/seed-shopify.js --only=definitions,products
node scripts/seed-shopify.js --only=menus
```

It creates definitions **before** anything that references them (reference
metafields can't be set otherwise), uploads the 44 product images through the
staged-upload flow, publishes every product and collection to the Online Store
publication (`status: ACTIVE` alone is not visible), and preserves the curated
manual order of `soft-muse` / `dark-siren`.

Re-runs never call `productSet` on an existing product — that mutation is
declarative and would wipe media and variants. Updates go through
`productUpdate` + `metafieldsSet`.

---

## Manual steps (no Admin API for these)

1. **Storefront filters** — Apps → Search & Discovery → Filters. Add Finish,
   Undertone and Palette. `sections/main-collection.liquid` already renders
   whatever `collection.filters` returns; the theme cannot create the facets.
2. **Currency** — the design shows `₹`. Set the store currency in
   Settings → Markets. Prices in `data/products.json` are numeric (1200 / 1400).
3. **Storefront password** — dev stores are password-protected by default
   (Online Store → Preferences). You cannot anonymously fetch the storefront
   until it's removed.
4. **Policies** — refund/privacy/terms/shipping ship as Pages. Paste the same
   copy into Settings → Policies if you also want the `/policies/*` URLs that
   checkout links to.
5. **Reviews** — the `review` metaobject definition is created with
   `storefront: PUBLIC_READ`. Add entries in Admin and reference them from a
   product's `custom.reviews`; until then `sections/pdp-reviews.liquid` falls
   back to the two editorial reviews defined in `templates/product.json`.

---

## Known deviations from the static build

- **Card quick-add is real.** `Reserve Your Set` on a product card adds the
  variant over `/cart/add.js` and opens the drawer, instead of navigating.
  Sold-out shades render `Join the Waitlist` as inert text.
- **Out-of-stock is inventory-driven.** The static PDP hard-coded Petal and
  Midnight as unavailable; the theme reads `variant.available`. The seeder sets
  `inventoryPolicy: CONTINUE` with tracking off so everything is buyable on day
  one — turn tracking on per variant when real stock exists.
- **Shade counts are computed.** "11 Shades in this Collection" now counts the
  linked collection, so it stays correct as shades are added.
- **Track-order page** lost its decorative form. Shopify owns order lookup
  (account orders + the emailed status URL); the guidance copy stays.
- **Google Fonts stay remote.** `theme check` flags this as a `RemoteAsset`
  warning. Cormorant Garamond and Inter are load-bearing for the design, so they
  are kept exactly as the static build loaded them. Swapping to `font_picker` +
  `font_face` would silence the warning and drop one third-party request.

## Verification

```bash
npx @shopify/cli theme check --path shopify-theme
# 59 files inspected, 0 errors (6 RemoteAsset warnings — see above)
```
