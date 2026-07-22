#!/usr/bin/env node
/**
 * Extracts the body of each static content page into data/pages/<handle>.html
 * so seed-shopify.js can push it into a Shopify Page.
 *
 * The page hero is dropped — main-page.liquid renders the title/lede from the
 * page record and its `custom.lede` metafield instead. Everything else is kept
 * verbatim: the ported base.css still carries all of those class names.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'data', 'pages');

const PAGES = [
  { file: 'about.html', handle: 'about', title: 'About' },
  { file: 'faq.html', handle: 'faq', title: 'FAQ' },
  // The contact form is rendered by sections/contact-form.liquid (a real
  // Shopify {% form 'contact' %}), so drop the static markup from the body.
  { file: 'contact.html', handle: 'contact', title: 'Contact', strip: ['section class="contact"'] },
  { file: 'shipping.html', handle: 'shipping', title: 'Shipping Policy' },
  { file: 'refund.html', handle: 'refund', title: 'Refund & Returns' },
  { file: 'privacy.html', handle: 'privacy', title: 'Privacy Policy' },
  { file: 'terms.html', handle: 'terms', title: 'Terms of Service' },
  { file: 'sitemap.html', handle: 'sitemap', title: 'Sitemap' },
  { file: 'size-guide.html', handle: 'size-guide', title: 'Size Guide' },
  { file: 'how-to-apply.html', handle: 'how-to-apply', title: 'How to Apply' },
  { file: 'comparison.html', handle: 'comparison', title: 'Press-on vs Extensions' },
  // Shopify owns order lookup (account orders + the emailed status URL), so the
  // decorative form goes and the guidance copy stays.
  { file: 'track-order.html', handle: 'track-order', title: 'Track Your Order', strip: ['section class="track"'] }
];

// Static route → Shopify route. Longest keys first so `index.html#soft-muse`
// is matched before bare `index.html`.
const LINKS = [
  ['index.html#soft-muse', '/collections/soft-muse'],
  ['index.html#dark-siren', '/collections/dark-siren'],
  ['index.html#ritual', '/pages/about'],
  ['index.html#story', '/pages/about'],
  ['index.html#journal', '/blogs/journal'],
  ['#soft-muse', '/collections/soft-muse'],
  ['#dark-siren', '/collections/dark-siren'],
  ['index.html', '/'],
  ['journal.html', '/blogs/journal'],
  ['about.html', '/pages/about'],
  ['faq.html', '/pages/faq'],
  ['contact.html', '/pages/contact'],
  ['shipping.html', '/pages/shipping'],
  ['refund.html', '/pages/refund'],
  ['privacy.html', '/pages/privacy'],
  ['terms.html', '/pages/terms'],
  ['sitemap.html', '/pages/sitemap'],
  ['size-guide.html', '/pages/size-guide'],
  ['how-to-apply.html', '/pages/how-to-apply'],
  ['comparison.html', '/pages/comparison'],
  ['track-order.html', '/pages/track-order']
];

function rewriteLinks(html) {
  // product.html?shade=veil and products/veil.html both become /products/veil
  html = html.replace(/(?:\.\.\/)?product\.html\?shade=([a-z0-9-]+)/gi, (_, slug) => `/products/${slug.toLowerCase()}`);
  html = html.replace(/(?:\.\.\/)?products\/([a-z0-9-]+)\.html/gi, (_, slug) => `/products/${slug.toLowerCase()}`);

  for (const [from, to] of LINKS) {
    html = html.split(from).join(to);
  }

  // Theme assets are served flat from the Shopify CDN.
  html = html.replace(/(?:\.\.\/)?assets\/images\//g, '');
  return html;
}

// Removes a <section …> … </section> block identified by an attribute snippet.
// Counts nested <section> opens so we cut at the matching close, not the first.
function stripSection(html, marker) {
  const open = html.indexOf(`<${marker}`);
  if (open === -1) return html;

  let depth = 0;
  let i = open;
  while (i < html.length) {
    const nextOpen = html.indexOf('<section', i + 1);
    const nextClose = html.indexOf('</section>', i + 1);
    if (nextClose === -1) return html.slice(0, open);

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen;
    } else if (depth > 0) {
      depth--;
      i = nextClose;
    } else {
      return html.slice(0, open) + html.slice(nextClose + '</section>'.length);
    }
  }
  return html;
}

function extract(file, strip) {
  const raw = fs.readFileSync(path.join(ROOT, file), 'utf8');

  const start = raw.indexOf('<main');
  const bodyStart = raw.indexOf('>', start) + 1;
  const end = raw.indexOf('</main>');
  if (start === -1 || end === -1) throw new Error(`No <main> in ${file}`);

  let inner = raw.slice(bodyStart, end);

  // Pull the lede out of the hero before dropping the hero itself.
  const ledeMatch = inner.match(/<p class="page-hero__lede">([\s\S]*?)<\/p>/);
  const lede = ledeMatch ? ledeMatch[1].replace(/\s+/g, ' ').trim() : '';

  const titleMatch = inner.match(/<h1 class="page-hero__title">([\s\S]*?)<\/h1>/);
  const displayTitle = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';

  inner = inner.replace(/<section class="page-hero">[\s\S]*?<\/section>/, '');

  for (const marker of strip || []) {
    inner = stripSection(inner, marker);
  }

  return { html: rewriteLinks(inner).trim(), lede, displayTitle };
}

fs.mkdirSync(OUT, { recursive: true });

const manifest = PAGES.map((page) => {
  const { html, lede, displayTitle } = extract(page.file, page.strip);
  fs.writeFileSync(path.join(OUT, `${page.handle}.html`), html + '\n');
  console.log(`${page.file} → data/pages/${page.handle}.html (${html.length} bytes)`);
  return { ...page, lede, displayTitle, body: `${page.handle}.html` };
});

fs.writeFileSync(path.join(ROOT, 'data', 'pages.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nWrote data/pages.json (${manifest.length} pages)`);
