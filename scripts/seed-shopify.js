#!/usr/bin/env node
/**
 * ZUVE Beauty — Shopify data seeder.
 *
 * Creates everything the Liquid theme reads: metafield + metaobject
 * definitions, products with images and variants, collections, pages,
 * the journal blog, and the navigation menus.
 *
 *   SHOPIFY_STORE=your-store.myshopify.com \
 *   SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxx \
 *   node scripts/seed-shopify.js [--dry-run] [--only=definitions,products,...]
 *
 * Required scopes: write_products, read_products, write_inventory,
 * read_inventory, read_locations, write_files, write_publications,
 * write_online_store_pages, write_online_store_navigation, write_content.
 *
 * Idempotent: existing products/collections/pages are updated in place.
 * productSet is only used to CREATE — it is declarative, so re-running it
 * against an existing product can wipe media and variants. Updates go
 * through productUpdate + metafieldsSet instead.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const IMAGES = path.join(ROOT, 'assets');
const API_VERSION = '2024-10';

// Load .env if it's there, so `node scripts/seed-shopify.js` just works. No
// dependency — process.loadEnvFile is built in from Node 20.12. Anything
// already exported in the shell is restored afterwards so it still wins.
const ENV_FILE = path.join(ROOT, '.env');
if (fs.existsSync(ENV_FILE) && typeof process.loadEnvFile === 'function') {
  const shell = { SHOPIFY_STORE: process.env.SHOPIFY_STORE, SHOPIFY_ADMIN_ACCESS_TOKEN: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN };
  process.loadEnvFile(ENV_FILE);
  for (const [k, v] of Object.entries(shell)) if (v) process.env[k] = v;
}

const STORE = process.env.SHOPIFY_STORE;
const TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const DRY_RUN = process.argv.includes('--dry-run');
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').replace('--only=', '').split(',').filter(Boolean);

if (!DRY_RUN && (!STORE || !TOKEN)) {
  console.error('Set SHOPIFY_STORE and SHOPIFY_ADMIN_ACCESS_TOKEN in .env (copy .env.example), or export them.');
  process.exit(1);
}

if (!DRY_RUN && TOKEN && !TOKEN.startsWith('shpat_')) {
  console.error(`Token starts with "${TOKEN.split('_')[0]}_" — only a shpat_ Admin API token can write products.`);
  process.exit(1);
}

if (TOKEN && !TOKEN.startsWith('shpat_')) {
  console.error(`Token starts with "${TOKEN.slice(0, 6)}…" — only shpat_ (Admin API) tokens can create products.`);
  process.exit(1);
}

const readJSON = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
const products = readJSON('products.json');
const collections = readJSON('collections.json');
const pages = readJSON('pages.json');
const menus = readJSON('menus.json');
const articles = fs.existsSync(path.join(DATA, 'articles.json')) ? readJSON('articles.json') : [];

const shouldRun = (step) => ONLY.length === 0 || ONLY.includes(step);
const log = (...a) => console.log(...a);

// ----------------------------------------------------------------
// GraphQL transport
// ----------------------------------------------------------------
async function gql(query, variables = {}) {
  if (DRY_RUN) {
    log(`  [dry-run] ${query.trim().split('\n')[0].slice(0, 90)}`);
    return {};
  }

  const res = await fetch(`https://${STORE}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
    body: JSON.stringify({ query, variables })
  });

  const body = await res.json();
  if (body.errors) throw new Error(JSON.stringify(body.errors, null, 2));

  // Every Shopify mutation returns its own userErrors array; surface them.
  for (const value of Object.values(body.data || {})) {
    const errs = value && (value.userErrors || value.mediaUserErrors);
    if (errs && errs.length) throw new Error(JSON.stringify(errs, null, 2));
  }

  return body.data;
}

// Shopify throttles at 2 points/sec on the standard plan; a small pause between
// writes keeps us clear without a full leaky-bucket implementation.
const pause = (ms = 350) => new Promise((r) => setTimeout(r, ms));

// ----------------------------------------------------------------
// 0. Sanity check — verify the token and find the Online Store publication
// ----------------------------------------------------------------
let onlineStorePublicationId = null;
let locationId = null;

async function preflight() {
  if (DRY_RUN) return;

  const data = await gql(`{
    shop { name currencyCode }
    publications(first: 20) { nodes { id name } }
    locations(first: 1) { nodes { id name } }
  }`);

  const online = data.publications.nodes.find((p) => p.name === 'Online Store');
  if (!online) throw new Error('No "Online Store" publication — is the sales channel installed?');

  onlineStorePublicationId = online.id;
  locationId = data.locations.nodes[0] && data.locations.nodes[0].id;

  log(`Shop: ${data.shop.name} (${data.shop.currencyCode})`);
  log(`Online Store publication: ${onlineStorePublicationId}`);
  log(`Location: ${locationId}\n`);

  if (data.shop.currencyCode !== 'INR') {
    log(`⚠️  Store currency is ${data.shop.currencyCode}; the design shows ₹.`);
    log('   Prices below are numeric — set the store currency in Settings → Markets.\n');
  }
}

// ----------------------------------------------------------------
// 1. Metafield + metaobject definitions
//    Reference metafields (list.product_reference, list.metaobject_reference)
//    CANNOT be set until their definition exists. Create these first.
// ----------------------------------------------------------------
const PRODUCT_METAFIELDS = [
  ['palette', 'Palette', 'single_line_text_field'],
  ['shade_number', 'Shade number', 'single_line_text_field'],
  ['finish', 'Finish', 'single_line_text_field'],
  ['undertone', 'Undertone', 'single_line_text_field'],
  ['wear', 'Wear', 'single_line_text_field'],
  ['shade_hex', 'Shade hex', 'single_line_text_field'],
  ['shade_deep_hex', 'Shade deep hex', 'single_line_text_field'],
  ['badge', 'Badge', 'single_line_text_field'],
  ['tagline', 'Tagline', 'single_line_text_field'],
  ['story', 'Story', 'multi_line_text_field'],
  ['mood', 'Mood', 'single_line_text_field'],
  ['pair_with', 'Pair with', 'single_line_text_field'],
  ['editorial_review', 'Editorial review', 'multi_line_text_field'],
  ['rating', 'Rating', 'number_decimal'],
  ['rating_count', 'Rating count', 'number_integer']
];

const DEFINITION_MUTATION = `
  mutation defCreate($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition { id key }
      userErrors { field message code }
    }
  }`;

async function createDefinition(definition) {
  // TAKEN just means it already exists — that is a success for our purposes.
  try {
    await gql(DEFINITION_MUTATION, { definition });
    log(`  + ${definition.ownerType}.${definition.namespace}.${definition.key}`);
  } catch (e) {
    if (String(e.message).includes('TAKEN')) {
      log(`  = ${definition.ownerType}.${definition.namespace}.${definition.key} (exists)`);
    } else {
      throw e;
    }
  }
  await pause(200);
}

async function seedDefinitions() {
  log('→ Metafield definitions');

  for (const [key, name, type] of PRODUCT_METAFIELDS) {
    await createDefinition({
      name,
      namespace: 'custom',
      key,
      type,
      ownerType: 'PRODUCT',
      access: { storefront: 'PUBLIC_READ' }
    });
  }

  await createDefinition({
    name: 'Pairs with',
    namespace: 'custom',
    key: 'pairs',
    type: 'list.product_reference',
    ownerType: 'PRODUCT',
    access: { storefront: 'PUBLIC_READ' }
  });

  await createDefinition({
    name: 'Palette',
    namespace: 'custom',
    key: 'palette',
    type: 'single_line_text_field',
    ownerType: 'COLLECTION',
    access: { storefront: 'PUBLIC_READ' }
  });

  for (const [key, name, type] of [
    ['lede', 'Lede', 'multi_line_text_field'],
    ['display_title', 'Display title', 'single_line_text_field']
  ]) {
    await createDefinition({
      name,
      namespace: 'custom',
      key,
      type,
      ownerType: 'PAGE',
      access: { storefront: 'PUBLIC_READ' }
    });
  }

  // Reviews live as metaobjects. PUBLIC_READ is required or Liquid sees nothing.
  log('→ Review metaobject definition');
  let reviewDefinitionId = null;
  try {
    const data = await gql(`
      mutation {
        metaobjectDefinitionCreate(definition: {
          name: "Review",
          type: "review",
          access: { storefront: PUBLIC_READ },
          fieldDefinitions: [
            { key: "author", name: "Author", type: "single_line_text_field" },
            { key: "location", name: "Location", type: "single_line_text_field" },
            { key: "title", name: "Title", type: "single_line_text_field" },
            { key: "body", name: "Body", type: "multi_line_text_field" },
            { key: "rating", name: "Rating", type: "number_integer" },
            { key: "verified", name: "Verified", type: "boolean" },
            { key: "published_at", name: "Published at", type: "date" }
          ]
        }) {
          metaobjectDefinition { id type }
          userErrors { field message code }
        }
      }`);
    reviewDefinitionId = data.metaobjectDefinitionCreate?.metaobjectDefinition?.id || null;
    log('  + metaobject "review"');
  } catch (e) {
    if (String(e.message).includes('TAKEN')) {
      log('  = metaobject "review" (exists)');
      const data = await gql(`{ metaobjectDefinitionByType(type: "review") { id } }`);
      reviewDefinitionId = data.metaobjectDefinitionByType?.id || null;
    } else {
      throw e;
    }
  }

  if (reviewDefinitionId) {
    await createDefinition({
      name: 'Reviews',
      namespace: 'custom',
      key: 'reviews',
      type: 'list.metaobject_reference',
      ownerType: 'PRODUCT',
      access: { storefront: 'PUBLIC_READ' },
      validations: [{ name: 'metaobject_definition_id', value: reviewDefinitionId }]
    });
  }

  log('');
}

// ----------------------------------------------------------------
// 2. Image upload — stagedUploadsCreate, then POST the bytes
// ----------------------------------------------------------------
async function stageUpload(filename) {
  const filePath = path.join(IMAGES, filename);
  if (!fs.existsSync(filePath)) throw new Error(`Missing image: ${filePath}`);

  const mime = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const size = String(fs.statSync(filePath).size);

  if (DRY_RUN) {
    log(`  [dry-run] would upload ${filename} (${size} bytes)`);
    return `dry-run://${filename}`;
  }

  const data = await gql(`
    mutation stage($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
      }
    }`, {
    input: [{ filename, mimeType: mime, resource: 'IMAGE', httpMethod: 'POST', fileSize: size }]
  });

  const target = data.stagedUploadsCreate.stagedTargets[0];

  // Parameters must be appended BEFORE the file part, and the request carries
  // no auth header — the credentials live in the presigned URL.
  const form = new FormData();
  for (const p of target.parameters) form.append(p.name, p.value);
  form.append('file', new Blob([fs.readFileSync(filePath)], { type: mime }), filename);

  const res = await fetch(target.url, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Staged upload failed for ${filename}: ${res.status} ${await res.text()}`);

  return target.resourceUrl;
}

// ----------------------------------------------------------------
// 3. Products
// ----------------------------------------------------------------
async function findProduct(handle) {
  const data = await gql(`query($h: String!) { productByHandle(handle: $h) { id handle } }`, { h: handle });
  return data.productByHandle || null;
}

async function seedProducts() {
  log('→ Products');
  const ids = {};

  for (const p of products) {
    const existing = await findProduct(p.handle);

    const metafields = [
      { namespace: 'custom', key: 'palette', type: 'single_line_text_field', value: p.palette },
      { namespace: 'custom', key: 'shade_number', type: 'single_line_text_field', value: p.shade_number },
      { namespace: 'custom', key: 'finish', type: 'single_line_text_field', value: p.finish },
      { namespace: 'custom', key: 'undertone', type: 'single_line_text_field', value: p.undertone },
      { namespace: 'custom', key: 'wear', type: 'single_line_text_field', value: p.wear },
      { namespace: 'custom', key: 'shade_hex', type: 'single_line_text_field', value: p.shade_hex },
      { namespace: 'custom', key: 'shade_deep_hex', type: 'single_line_text_field', value: p.shade_deep_hex },
      { namespace: 'custom', key: 'tagline', type: 'single_line_text_field', value: p.tagline },
      { namespace: 'custom', key: 'story', type: 'multi_line_text_field', value: p.story },
      { namespace: 'custom', key: 'mood', type: 'single_line_text_field', value: p.mood },
      { namespace: 'custom', key: 'pair_with', type: 'single_line_text_field', value: p.pair_with },
      { namespace: 'custom', key: 'editorial_review', type: 'multi_line_text_field', value: p.editorial_review }
    ];
    if (p.badge) metafields.push({ namespace: 'custom', key: 'badge', type: 'single_line_text_field', value: p.badge });

    if (existing) {
      // Incremental path — never productSet an existing product.
      log(`  = ${p.handle} (exists, updating fields + metafields)`);
      await gql(`
        mutation($input: ProductInput!) {
          productUpdate(input: $input) { product { id } userErrors { field message } }
        }`, {
        input: {
          id: existing.id,
          title: p.title,
          descriptionHtml: `<p>${p.story}</p>`,
          productType: 'Nail Lacquer',
          vendor: 'ZUVE Beauty',
          tags: p.tags,
          status: 'ACTIVE',
          metafields
        }
      });
      ids[p.handle] = existing.id;
      await pause();
      continue;
    }

    log(`  + ${p.handle} (uploading ${p.images.length} images)`);
    const files = [];
    for (const img of p.images) {
      files.push({
        originalSource: await stageUpload(img),
        contentType: 'IMAGE',
        alt: `${p.title} — ${p.finish} nail lacquer by ZUVE Beauty`
      });
    }

    const data = await gql(`
      mutation($input: ProductSetInput!) {
        productSet(synchronous: true, input: $input) {
          product { id handle variants(first: 5) { nodes { id inventoryItem { id } } } }
          userErrors { field message }
        }
      }`, {
      input: {
        handle: p.handle,
        title: p.title,
        descriptionHtml: `<p>${p.story}</p>`,
        productType: 'Nail Lacquer',
        vendor: 'ZUVE Beauty',
        tags: p.tags,
        status: 'ACTIVE',
        productOptions: [{ name: 'Size', values: [{ name: '15ml' }] }],
        variants: [{
          optionValues: [{ optionName: 'Size', name: '15ml' }],
          price: p.price,
          sku: `ZB-${p.handle.toUpperCase()}-15`,
          inventoryPolicy: 'CONTINUE',
          inventoryItem: { tracked: false }
        }],
        files,
        metafields
      }
    });

    ids[p.handle] = data.productSet?.product?.id;
    await pause(500);
  }

  // status: ACTIVE is not the same as visible — publish to the Online Store.
  log('→ Publishing products to the Online Store');
  for (const [handle, id] of Object.entries(ids)) {
    if (!id) continue;
    await gql(`
      mutation($id: ID!, $pub: ID!) {
        publishablePublish(id: $id, input: { publicationId: $pub }) {
          userErrors { field message }
        }
      }`, { id, pub: onlineStorePublicationId });
    log(`  ✓ ${handle}`);
    await pause(250);
  }

  // "Pairs with" is a reference metafield — its definition had to exist first.
  log('→ Linking "pairs with"');
  for (const p of products) {
    const targets = p.pairs.map((h) => ids[h]).filter(Boolean);
    if (!ids[p.handle] || targets.length === 0) continue;
    await gql(`
      mutation($mf: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $mf) { userErrors { field message } }
      }`, {
      mf: [{
        ownerId: ids[p.handle],
        namespace: 'custom',
        key: 'pairs',
        type: 'list.product_reference',
        value: JSON.stringify(targets)
      }]
    });
    log(`  ✓ ${p.handle} → ${p.pairs.join(', ')}`);
    await pause(250);
  }

  log('');
  return ids;
}

// ----------------------------------------------------------------
// 4. Collections
// ----------------------------------------------------------------
async function seedCollections(productIds) {
  log('→ Collections');

  for (const c of collections) {
    const found = await gql(`query($q: String!) { collections(first: 1, query: $q) { nodes { id handle } } }`, {
      q: `handle:${c.handle}`
    });
    let id = found.collections?.nodes?.[0]?.id;

    const input = {
      handle: c.handle,
      title: c.title,
      descriptionHtml: c.description,
      sortOrder: c.type === 'manual' ? 'MANUAL' : 'BEST_SELLING',
      metafields: [{ namespace: 'custom', key: 'palette', type: 'single_line_text_field', value: c.palette }]
    };

    if (c.type === 'smart') {
      input.ruleSet = { appliedDisjunctively: false, rules: [c.rule] };
    }

    if (id) {
      await gql(`mutation($input: CollectionInput!) { collectionUpdate(input: $input) { collection { id } userErrors { field message } } }`, {
        input: { ...input, id }
      });
      log(`  = ${c.handle} (updated)`);
    } else {
      const data = await gql(`mutation($input: CollectionInput!) { collectionCreate(input: $input) { collection { id } userErrors { field message } } }`, { input });
      id = data.collectionCreate?.collection?.id;
      log(`  + ${c.handle}`);
    }

    // Manual collections keep the curated order — smart ones cannot be ordered.
    if (c.type === 'manual' && id && c.products) {
      const gids = c.products.map((h) => productIds[h]).filter(Boolean);
      if (gids.length) {
        await gql(`
          mutation($id: ID!, $ids: [ID!]!) {
            collectionAddProductsV2(id: $id, productIds: $ids) { userErrors { field message } }
          }`, { id, ids: gids });
        log(`    ↳ ${gids.length} products in curated order`);
      }
    }

    if (id) {
      await gql(`
        mutation($id: ID!, $pub: ID!) {
          publishablePublish(id: $id, input: { publicationId: $pub }) { userErrors { field message } }
        }`, { id, pub: onlineStorePublicationId });
    }

    await pause(400);
  }

  log('  ℹ Smart collections reindex with a delay — an instant count of 0 is not a failure.\n');
}

// ----------------------------------------------------------------
// 5. Pages
// ----------------------------------------------------------------
async function seedPages() {
  log('→ Pages');

  for (const p of pages) {
    const body = fs.readFileSync(path.join(DATA, 'pages', p.body), 'utf8');
    const metafields = [];
    if (p.lede) metafields.push({ namespace: 'custom', key: 'lede', type: 'multi_line_text_field', value: p.lede });
    if (p.displayTitle) metafields.push({ namespace: 'custom', key: 'display_title', type: 'single_line_text_field', value: p.displayTitle });

    const found = await gql(`query($q: String!) { pages(first: 1, query: $q) { nodes { id handle } } }`, { q: `handle:${p.handle}` });
    const id = found.pages?.nodes?.[0]?.id;

    // The contact page's body is empty — its form is a theme section.
    const input = {
      title: p.title,
      handle: p.handle,
      body,
      isPublished: true,
      templateSuffix: p.handle === 'contact' ? 'contact' : null,
      metafields
    };

    if (id) {
      await gql(`mutation($id: ID!, $page: PageUpdateInput!) { pageUpdate(id: $id, page: $page) { userErrors { field message } } }`, { id, page: input });
      log(`  = ${p.handle} (updated)`);
    } else {
      await gql(`mutation($page: PageCreateInput!) { pageCreate(page: $page) { page { id } userErrors { field message } } }`, { page: input });
      log(`  + ${p.handle}`);
    }

    await pause(300);
  }

  log('');
}

// ----------------------------------------------------------------
// 6. Journal blog + articles
// ----------------------------------------------------------------
async function seedBlog() {
  if (!articles.length) {
    log('→ Journal: no data/articles.json, skipping\n');
    return;
  }

  log('→ Journal');
  const found = await gql(`{ blogs(first: 20) { nodes { id handle } } }`);
  let blogId = found.blogs?.nodes?.find((b) => b.handle === 'journal')?.id;

  if (!blogId) {
    const data = await gql(`
      mutation($blog: BlogCreateInput!) {
        blogCreate(blog: $blog) { blog { id } userErrors { field message } }
      }`, { blog: { title: 'The Journal', handle: 'journal' } });
    blogId = data.blogCreate?.blog?.id;
    log('  + blog "journal"');
  } else {
    log('  = blog "journal" (exists)');
  }

  for (const a of articles) {
    await gql(`
      mutation($article: ArticleCreateInput!) {
        articleCreate(article: $article) { article { id } userErrors { field message } }
      }`, {
      article: {
        blogId,
        title: a.title,
        handle: a.handle,
        body: a.body,
        summary: a.excerpt,
        tags: a.tags || [],
        isPublished: true,
        author: { name: 'ZUVE Beauty' }
      }
    });
    log(`  + ${a.handle}`);
    await pause(300);
  }

  log('');
}

// ----------------------------------------------------------------
// 7. Navigation menus
// ----------------------------------------------------------------
async function seedMenus() {
  log('→ Menus');

  const toItem = (item) => {
    const base = { title: item.title, type: item.type };
    if (item.type === 'HTTP') base.url = item.url;
    if (item.type === 'COLLECTION') base.url = `/collections/${item.handle}`;
    if (item.type === 'PAGE') base.url = `/pages/${item.handle}`;
    if (item.type === 'BLOG') base.url = `/blogs/${item.handle}`;
    // Everything is expressed as a plain link so the seeder never has to
    // resolve GIDs that may not exist yet on a fresh store.
    base.type = 'HTTP';
    if (item.items) base.items = item.items.map(toItem);
    return base;
  };

  const existing = await gql(`{ menus(first: 50) { nodes { id handle } } }`);

  for (const m of menus) {
    const items = m.items.map(toItem);
    const found = existing.menus?.nodes?.find((n) => n.handle === m.handle);

    if (found) {
      await gql(`
        mutation($id: ID!, $title: String!, $handle: String!, $items: [MenuItemUpdateInput!]!) {
          menuUpdate(id: $id, title: $title, handle: $handle, items: $items) { userErrors { field message } }
        }`, { id: found.id, title: m.title, handle: m.handle, items });
      log(`  = ${m.handle} (updated)`);
    } else {
      await gql(`
        mutation($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) {
          menuCreate(title: $title, handle: $handle, items: $items) { menu { id } userErrors { field message } }
        }`, { title: m.title, handle: m.handle, items });
      log(`  + ${m.handle}`);
    }

    await pause(300);
  }

  log('');
}

// ----------------------------------------------------------------
async function main() {
  if (DRY_RUN) log('DRY RUN — no writes will be made.\n');

  await preflight();

  if (shouldRun('definitions')) await seedDefinitions();

  let productIds = {};
  if (shouldRun('products')) productIds = await seedProducts();

  if (shouldRun('collections')) {
    if (Object.keys(productIds).length === 0) {
      // Running --only=collections: look the products up rather than guessing.
      for (const p of products) {
        const found = await findProduct(p.handle);
        if (found) productIds[p.handle] = found.id;
      }
    }
    await seedCollections(productIds);
  }

  if (shouldRun('pages')) await seedPages();
  if (shouldRun('blog')) await seedBlog();
  if (shouldRun('menus')) await seedMenus();

  log('Done.\n');
  log('Manual steps that have no Admin API:');
  log('  1. Apps → Search & Discovery → Filters: add Finish / Undertone / Palette as storefront filters.');
  log('  2. Settings → Policies: paste the refund/privacy/terms/shipping copy if you want /policies/* URLs too.');
  log('  3. Online Store → Preferences: remove the storefront password when you go live.');
}

main().catch((e) => {
  console.error('\n✖ Seed failed:\n' + e.message);
  process.exit(1);
});
