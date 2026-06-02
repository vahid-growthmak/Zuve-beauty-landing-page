/* ============================================================
   ZUVE BEAUTY — PRODUCT PAGE (PDP)
   Single template, query-string driven. ?shade=<slug>.
   ============================================================ */

(function () {
  'use strict';

  // ----------------------------------------------------------
  // PRODUCT CATALOGUE — 11 shades across Soft Muse + Dark Siren
  // ----------------------------------------------------------
  const PRODUCTS = {
    /* —— SOFT MUSE —— */
    veil: {
      slug: 'veil', name: 'Veil', number: 'No. 01',
      collection: 'soft', collectionName: 'The Soft Muse',
      finish: 'Glazed', undertone: 'Warm', wear: '72 hours',
      shade: '#E8D6C9', shadeDeep: '#C9A5A2',
      price: '1,200', tag: null,
      tagline: 'A second-skin nude. The hand, unbothered.',
      story:
        'Veil was born from the moment after — after the wedding, the meeting, the long day of being seen. The shade you wear when you no longer need to perform. A whisper of warmth that lets your hand speak first, and your voice second.',
      mood: 'Slow Mornings',
      pairWith: 'Linen sheets, slow espresso, an unread book',
      review:
        '“I bought it for a wedding and ended up wearing it for three weeks. It became part of how I wanted to dress.”',
      image: 'assets/images/soft_veil.jpg',
      pairs: ['whisper', 'linen', 'bare']
    },
    whisper: {
      slug: 'whisper', name: 'Whisper', number: 'No. 02',
      collection: 'soft', collectionName: 'The Soft Muse',
      finish: 'Sheer', undertone: 'Cool', wear: '60 hours',
      shade: '#EAD0CB', shadeDeep: '#C9A5A2',
      price: '1,200', tag: null,
      tagline: 'Pale blush, quiet authority.',
      story:
        'Some women command attention by raising their voice. Others, by lowering it. Whisper is the shade for the latter — a barely-there blush that earns the second glance, not the first.',
      mood: 'Long Conversations',
      pairWith: 'Late lunches, listening more than speaking, the right wine',
      review:
        '“It looks like nothing in the bottle and like everything once it dries.”',
      image: 'assets/images/soft_whisper.jpg',
      pairs: ['veil', 'petal', 'linen']
    },
    linen: {
      slug: 'linen', name: 'Linen', number: 'No. 03',
      collection: 'soft', collectionName: 'The Soft Muse',
      finish: 'Glazed', undertone: 'Warm', wear: '72 hours',
      shade: '#E0CCB8', shadeDeep: '#A88C72',
      price: '1,200', tag: 'Cult Favorite',
      tagline: 'Warm cream. Made for slow mornings.',
      story:
        'Linen was the first shade the team refused to share. The color of the sheets you don’t want to leave, the latte foam you ordered to-stay. A neutral that knows it is anything but ordinary — the quiet luxury everyone tries to copy but few can find.',
      mood: 'Soft Sundays',
      pairWith: 'Cashmere socks, a paperback, a window seat',
      review:
        '“I wear Linen the way some women wear their grandmother’s ring.”',
      image: 'assets/images/soft_linen.jpg',
      pairs: ['veil', 'sand', 'bare']
    },
    bare: {
      slug: 'bare', name: 'Bare', number: 'No. 04',
      collection: 'soft', collectionName: 'The Soft Muse',
      finish: 'Matte', undertone: 'Warm', wear: '72 hours',
      shade: '#C9A5A2', shadeDeep: '#7F5D5A',
      price: '1,200', tag: null,
      tagline: 'Soft taupe with the weight of restraint.',
      story:
        'Bare arrives at the dinner without trying to be the conversation. A taupe with a whisper of rose underneath — the color of a cashmere coat thrown over a black dress. Quiet, expensive, unforgettable in retrospect.',
      mood: 'Quiet Evenings',
      pairWith: 'A black dress, low candles, the second martini',
      review:
        '“The color of someone who has decided what she wants and isn’t going to explain it.”',
      image: 'assets/images/soft_bare.jpg',
      pairs: ['linen', 'petal', 'whisper']
    },
    petal: {
      slug: 'petal', name: 'Petal', number: 'No. 05',
      collection: 'soft', collectionName: 'The Soft Muse',
      finish: 'Sheer', undertone: 'Rose', wear: '60 hours',
      shade: '#D4A89F', shadeDeep: '#8A5C53',
      price: '1,200', tag: 'Last 12 Sets',
      tagline: 'Dusty rose. The blush before the word.',
      story:
        'Petal is the color of the second your face changes — when you’ve heard something you didn’t expect and your skin tells the truth before your mouth catches up. A blush translated into a shade.',
      mood: 'First Encounters',
      pairWith: 'A letter you weren’t expecting, an honest answer, summer',
      review:
        '“It does what blush does for the face. Petal does it for the hand.”',
      image: 'assets/images/soft_petal.jpg',
      pairs: ['whisper', 'veil', 'bare']
    },
    sand: {
      slug: 'sand', name: 'Sand', number: 'No. 06',
      collection: 'soft', collectionName: 'The Soft Muse',
      finish: 'Glazed', undertone: 'Warm', wear: '72 hours',
      shade: '#D9B8A3', shadeDeep: '#A07F66',
      price: '1,200', tag: null,
      tagline: 'Light tan. Sun-warmed, sea-adjacent.',
      story:
        'Sand was made for the seventh day of a trip you didn’t want to end. The color of skin touched by salt and afternoon light, the kind of warm that lives in your hand for weeks after you fly home.',
      mood: 'Endless Summers',
      pairWith: 'Coastal towns, linen shirts, the slow drink that follows',
      review:
        '“I took it on holiday and brought back a bottle’s worth of evidence.”',
      image: 'assets/images/soft_sand.jpg',
      pairs: ['linen', 'veil', 'petal']
    },

    /* —— DARK SIREN —— */
    reign: {
      slug: 'reign', name: 'Reign', number: 'No. 07',
      collection: 'dark', collectionName: 'The Dark Siren',
      finish: 'Glossy', undertone: 'Cool', wear: '72 hours',
      shade: '#8A0E17', shadeDeep: '#3A0F1A',
      price: '1,400', tag: 'Power Shade',
      tagline: 'The blood red that rewrote the rules.',
      story:
        'Reign is the shade for the woman who has already decided. The red of the lipstick mark left on the rim of a glass, the seal at the bottom of a letter that means it. A color you don’t ask permission to wear.',
      mood: 'Command Performances',
      pairWith: 'A tailored coat, an unread room, the last word',
      review:
        '“Reign is the shade I put on when I need to stop second-guessing.”',
      image: 'assets/images/dark_reign.jpg',
      pairs: ['vampire', 'velvet', 'midnight']
    },
    vampire: {
      slug: 'vampire', name: 'Vampire', number: 'No. 08',
      collection: 'dark', collectionName: 'The Dark Siren',
      finish: 'Glossy', undertone: 'Cool', wear: '72 hours',
      shade: '#5B1421', shadeDeep: '#2A0810',
      price: '1,400', tag: 'Cult Favorite',
      tagline: 'Wine, distilled.',
      story:
        'Vampire is what happens when a great red ages another decade. A wine so deep it reads as memory — the bottle opened for the conversation that changed everything. Worn by the women who don’t reschedule.',
      mood: 'Long Nights',
      pairWith: 'A heavier perfume, a slow restaurant, the second bottle',
      review:
        '“The darkest red I’ve owned that still looked like a red.”',
      image: 'assets/images/dark_vampire.jpg',
      pairs: ['reign', 'midnight', 'obsession']
    },
    midnight: {
      slug: 'midnight', name: 'Midnight', number: 'No. 09',
      collection: 'dark', collectionName: 'The Dark Siren',
      finish: 'Matte', undertone: 'Cool', wear: '72 hours',
      shade: '#3A0F1A', shadeDeep: '#1A0510',
      price: '1,400', tag: 'Last 12 Sets',
      tagline: 'Black plum. The hour before.',
      story:
        'Midnight isn’t dark. It’s the color of dusk caught between hours — a shade so deep it reads black until the light hits, and then it confesses its wine underneath. A secret kept in plain sight.',
      mood: 'Hour of Decisions',
      pairWith: 'A leather jacket, the cab home, an honest 1 a.m.',
      review:
        '“It looks like one color in the bottle and three on the hand.”',
      image: 'assets/images/dark_midnight.jpg',
      pairs: ['vampire', 'obsession', 'velvet']
    },
    velvet: {
      slug: 'velvet', name: 'Velvet', number: 'No. 10',
      collection: 'dark', collectionName: 'The Dark Siren',
      finish: 'Glossy', undertone: 'Cool', wear: '72 hours',
      shade: '#6B0F1F', shadeDeep: '#2A0810',
      price: '1,400', tag: 'Power Shade',
      tagline: 'Rich burgundy with weight.',
      story:
        'Velvet is the shade you wear when the conversation matters. A burgundy with the depth of an old garnet, the kind of color that makes your hand the first thing remembered about the room.',
      mood: 'High Stakes',
      pairWith: 'A long table, a strong opinion, an even temper',
      review:
        '“I wore Velvet to a negotiation. It read for me.”',
      image: 'assets/images/dark_velvet.jpg',
      pairs: ['reign', 'midnight', 'vampire']
    },
    obsession: {
      slug: 'obsession', name: 'Obsession', number: 'No. 11',
      collection: 'dark', collectionName: 'The Dark Siren',
      finish: 'Glossy', undertone: 'Cool', wear: '72 hours',
      shade: '#2A0810', shadeDeep: '#0A0408',
      price: '1,400', tag: 'New Drop',
      tagline: 'Black cherry. The shade you keep returning to.',
      story:
        'Obsession was tested seven times before we let it leave the lab. Not because it didn’t work — because it was too quiet. A black cherry that looks, at every angle, like something you’d want to keep. Then keep wearing.',
      mood: 'Returning Habits',
      pairWith: 'A repeated playlist, a familiar perfume, a habit you keep',
      review:
        '“I bought one, ran out, bought three.”',
      image: 'assets/images/dark_obsession.jpg',
      pairs: ['midnight', 'vampire', 'reign']
    }
  };

  // ----------------------------------------------------------
  // ROUTING — three sources, in priority order:
  //   1. <html data-shade="..."> attribute (dedicated /products/<slug>.html)
  //   2. ?shade=<slug> query string (legacy /product.html route)
  //   3. fallback: 'veil'
  // ----------------------------------------------------------
  const html = document.documentElement;
  const params = new URLSearchParams(window.location.search);
  const slug = (html.dataset.shade || params.get('shade') || 'veil').toLowerCase();
  const product = PRODUCTS[slug] || PRODUCTS.veil;

  // ----------------------------------------------------------
  // PATH AWARENESS — pages in /products/ need ../ prefix for assets
  // and links back to landing; legacy /product.html does not.
  // ----------------------------------------------------------
  const inProductsDir = /\/products\//.test(window.location.pathname);
  const r = (path) => inProductsDir ? '../' + path : path;
  const peerProductHref = (peerSlug) =>
    inProductsDir ? `${peerSlug}.html` : `product.html?shade=${peerSlug}`;

  // ----------------------------------------------------------
  // THEME — switch root data-theme to drive Soft / Dark palettes
  // ----------------------------------------------------------
  html.setAttribute('data-theme', product.collection);
  document.body.classList.toggle('is-dark-pdp', product.collection === 'dark');

  // ----------------------------------------------------------
  // RENDER — populate every [data-product-*] in the document
  // ----------------------------------------------------------
  // Replace text content but preserve trailing punctuation that templates
  // depend on for editorial cadence (e.g. "Veil." inside a story headline).
  function setText(selector, value) {
    document.querySelectorAll(selector).forEach((el) => {
      const original = el.textContent;
      const trailing = (original.match(/[.!?,;:]+$/) || [''])[0];
      el.textContent = value + trailing;
    });
  }

  // Setting CSS custom properties on html lets every var(--shade) reference
  // in stylesheets resolve correctly — without nuking the radial gradients
  // those rules also include.
  function setShadeVar() {
    html.style.setProperty('--shade', product.shade);
    html.style.setProperty('--shade-deep', product.shadeDeep);
    html.style.setProperty('--product-shade', product.shade);
    html.style.setProperty('--product-shade-deep', product.shadeDeep);
  }

  function renderStatic() {
    // Page title
    document.title = `${product.name} — ${product.collectionName} • ZUVE Beauty`;

    // Meta description (pull tagline)
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', `${product.tagline} ${product.collectionName}, by ZUVE Beauty.`);

    setText('[data-product-name]', product.name);
    setText('[data-product-number]', product.number);
    setText('[data-product-collection-name]', product.collectionName);
    setText('[data-product-finish]', product.finish);
    setText('[data-product-undertone]', product.undertone);
    setText('[data-product-wear]', product.wear);
    setText('[data-product-price]', product.price);
    setText('[data-product-tagline]', product.tagline);
    setText('[data-product-story]', product.story);
    setText('[data-product-mood]', product.mood);
    setText('[data-product-pair-with]', product.pairWith);

    // Eyebrow with collection prefix + number
    document.querySelectorAll('[data-product-collection]').forEach((el) => {
      const prefix = product.collection === 'dark' ? 'II — Dark Siren' : 'I — Soft Muse';
      el.innerHTML = `${prefix} <span aria-hidden="true">·</span> ${product.number}`;
    });

    // Mode badge (breadcrumb area) — flips with collection
    setText(
      '[data-mode-badge]',
      product.collection === 'dark' ? 'Dark Siren Edit' : 'Soft Muse Edit'
    );

    // Breadcrumb collection link (path-aware so it resolves correctly
    // whether the user is on /product.html or /products/<slug>.html)
    document.querySelectorAll('[data-product-collection-link]').forEach((el) => {
      el.textContent = product.collectionName;
      const anchor = product.collection === 'dark' ? '#dark-siren' : '#soft-muse';
      el.setAttribute('href', r('index.html') + anchor);
    });

    // Review quote
    document.querySelectorAll('[data-product-review-1]').forEach((el) => {
      el.textContent = product.review;
    });

    // Tag badge
    const tagEl = document.querySelector('[data-product-tag]');
    if (tagEl) {
      if (product.tag) {
        tagEl.textContent = product.tag;
        tagEl.hidden = false;
      } else {
        tagEl.hidden = true;
      }
    }

    // Hero image — set src (path-aware), hide cleanly if 404
    document.querySelectorAll('[data-product-image]').forEach((img) => {
      img.setAttribute('src', r(product.image));
      img.setAttribute('alt', `${product.name} — ${product.collectionName} nail lacquer`);
      const hide = () => { img.style.display = 'none'; };
      if (img.complete && img.naturalWidth === 0) {
        hide();
      } else {
        img.addEventListener('error', hide, { once: true });
      }
    });

    // Thumbnail images
    document.querySelectorAll('[data-product-thumb]').forEach((img) => {
      const type = img.getAttribute('data-product-thumb');
      if (type === 'hero') {
        img.setAttribute('src', r(product.image));
      } else {
        const pfix = product.collection === 'dark' ? 'dark' : 'soft';
        img.setAttribute('src', r(`assets/images/${pfix}_${product.slug}_${type}.png`));
      }
      img.setAttribute('alt', `${product.name} — ${type} view`);
    });

    setShadeVar();
  }

  // ----------------------------------------------------------
  // RENDER SWATCH GRID
  // ----------------------------------------------------------
  function renderSwatches() {
    const grid = document.querySelector('[data-swatch-grid]');
    if (!grid) return;
    
    // Filter to only shades in the current collection
    const shades = Object.values(PRODUCTS).filter(p => p.collection === product.collection);
    
    // Update shade count
    const countEl = document.querySelector('.pdp__shade-count');
    if (countEl) countEl.textContent = `${shades.length} Shades in this Collection`;

    let html = '';
    shades.forEach((p) => {
      const isSelected = p.slug === product.slug;
      const oos = p.slug === 'petal' || p.slug === 'midnight'; // Simulating out of stock
      const isLimited = p.tag === 'New Drop' || p.tag === 'Last 12 Sets';
      
      let attrs = isSelected ? 'aria-checked="true" class="pdp__swatch is-active"' : 'aria-checked="false" class="pdp__swatch"';
      let waitlistHtml = oos ? '<span class="pdp__swatch-slash" aria-hidden="true"></span>' : '';
      let limitedHtml = isLimited ? '<span class="pdp__swatch-dot" aria-hidden="true" title="Limited Edition"></span>' : '';
      
      html += `
        <a href="${peerProductHref(p.slug)}" role="radio" ${attrs} aria-label="${p.name}" title="${p.name}">
          <span class="pdp__swatch-color" style="background: ${p.shade}"></span>
          ${waitlistHtml}
          ${limitedHtml}
        </a>
      `;
    });
    grid.innerHTML = html;
  }

  // ----------------------------------------------------------
  // RENDER CROSS-SELL CARDS (Pair With + More From Collection)
  // ----------------------------------------------------------
  function buildCardHTML(p, variant) {
    const isDark = p.collection === 'dark';
    const tagClass = isDark ? 'card__tag--power' : 'card__tag--featured';
    return `
      <a class="pdp-card pdp-card--${variant}" href="${peerProductHref(p.slug)}">
        <div class="pdp-card__media">
          <img class="pdp-card__img" src="${r(p.image)}" alt="" loading="lazy" />
          <span class="pdp-card__shade" style="background:${p.shade}"></span>
          ${p.tag ? `<span class="pdp-card__tag ${tagClass}">${p.tag}</span>` : ''}
        </div>
        <div class="pdp-card__meta">
          <h3 class="pdp-card__name">${p.name}</h3>
          <span class="pdp-card__price">₹${p.price}</span>
        </div>
        <p class="pdp-card__note">${p.tagline}</p>
      </a>
    `;
  }

  function renderPairs() {
    const grid = document.querySelector('[data-product-pair-grid]');
    if (!grid) return;
    const html = product.pairs
      .map((s) => PRODUCTS[s])
      .filter(Boolean)
      .map((p) => buildCardHTML(p, 'pair'))
      .join('');
    grid.innerHTML = html;
    bindPdpCardImages(grid);
  }

  function renderMore() {
    const grid = document.querySelector('[data-product-more-grid]');
    if (!grid) return;
    const more = Object.values(PRODUCTS)
      .filter((p) => p.collection === product.collection && p.slug !== product.slug)
      .slice(0, 4);
    grid.innerHTML = more.map((p) => buildCardHTML(p, 'more')).join('');
    bindPdpCardImages(grid);
  }

  // If any product card image 404s, swap it for the shade swatch so the card
  // stays editorial instead of broken.
  function bindPdpCardImages(root) {
    root.querySelectorAll('.pdp-card__img').forEach((img) => {
      const hide = () => {
        img.style.display = 'none';
        const swatch = img.parentElement && img.parentElement.querySelector('.pdp-card__shade');
        if (swatch) swatch.classList.add('pdp-card__shade--full');
      };
      if (img.complete && img.naturalWidth === 0) {
        hide();
      } else {
        img.addEventListener('error', hide, { once: true });
      }
    });
  }

  // ----------------------------------------------------------
  // QUANTITY SELECTOR
  // ----------------------------------------------------------
  function bindQuantity() {
    const num = document.getElementById('pdpQty');
    if (!num) return;
    let qty = 1;
    document.querySelectorAll('[data-qty]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const delta = Number(btn.dataset.qty);
        qty = Math.max(1, Math.min(9, qty + delta));
        num.textContent = String(qty);
      });
    });
  }

  // ----------------------------------------------------------
  // ----------------------------------------------------------
  // GALLERY THUMBNAILS — switch the active state and main image.
  // ----------------------------------------------------------
  function bindThumbs() {
    const thumbs = document.querySelectorAll('.pdp__thumb');
    const heroImg = document.querySelector('.pdp__hero-img');

    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        thumbs.forEach((t) => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        thumb.classList.add('is-active');
        thumb.setAttribute('aria-selected', 'true');

        // Swap the hero image src to match the thumb
        if (heroImg) {
          const thumbImg = thumb.querySelector('.pdp__thumb-img');
          if (thumbImg) {
            heroImg.setAttribute('src', thumbImg.getAttribute('src'));
            heroImg.setAttribute('alt', thumbImg.getAttribute('alt'));
          }
        }
      });
    });
  }

  // ----------------------------------------------------------
  // FORMULA TABS
  // ----------------------------------------------------------
  function bindTabs() {
    const tabs = document.querySelectorAll('.pdp-formula__tabs [role="tab"]');
    const panels = document.querySelectorAll('.pdp-formula__panel');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');

        const key = tab.dataset.tab;
        panels.forEach((p) => {
          const match = p.dataset.panel === key;
          p.classList.toggle('is-active', match);
          if (match) {
            p.removeAttribute('hidden');
          } else {
            p.setAttribute('hidden', '');
          }
        });
      });
    });
  }

  // ----------------------------------------------------------
  // CTA — fake "added to bag" feedback (no real cart wired)
  // ----------------------------------------------------------
  function bindCta() {
    document.querySelectorAll('[data-product-cta]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const original = btn.querySelector('span').textContent;
        btn.querySelector('span').textContent = 'Reserved — In Your Bag';
        btn.classList.add('is-added');
        const bagCount = document.querySelector('.icon-btn__count');
        if (bagCount) bagCount.textContent = String(Number(bagCount.textContent) + 1);
        setTimeout(() => {
          btn.querySelector('span').textContent = original;
          btn.classList.remove('is-added');
        }, 2400);
      });
    });
  }

  // ----------------------------------------------------------
  // STICKY CTA — appears when buy block scrolls past top
  // ----------------------------------------------------------
  function bindStickyCta() {
    const sticky = document.getElementById('pdpSticky');
    const buyBlock = document.querySelector('.pdp__buy');
    if (!sticky || !buyBlock) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const out = !entry.isIntersecting && entry.boundingClientRect.top < 0;
          sticky.classList.toggle('is-visible', out);
          sticky.setAttribute('aria-hidden', out ? 'false' : 'true');
        });
      },
      { threshold: 0 }
    );
    io.observe(buyBlock);
  }

  // ----------------------------------------------------------
  // INIT
  // ----------------------------------------------------------
  renderStatic();
  renderSwatches();
  renderPairs();
  renderMore();
  bindQuantity();
  bindThumbs();
  bindTabs();
  bindCta();
  bindStickyCta();
})();
