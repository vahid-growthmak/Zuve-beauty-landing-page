/* ============================================================
   ZUVE BEAUTY — THEME INTERACTIONS (Shopify)
   Ported from the static build. Scroll-driven colour transition,
   supporting motion, plus the AJAX cart the static site never had.
   ============================================================ */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var body = document.body;
  var routes = (window.ZUVE && window.ZUVE.routes) || {};

  // ----------------------------------------------------------
  // 1. NAV — sticky behaviour, scroll progress, hero parallax
  // ----------------------------------------------------------
  var nav = document.getElementById('nav');
  var heroEl = document.querySelector('.hero');
  var heroVisuals = document.querySelectorAll('.hero__visual');
  var darkCollection = document.querySelector('.collection--dark');

  function handleScrollProgress(y) {
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    root.style.setProperty('--scroll-progress', Math.max(0, Math.min(1, y / max)).toFixed(3));
  }

  // Image layer moves down at 0.28x scroll speed → effective ascent is 0.72x.
  function handleHeroParallax(y) {
    if (reduceMotion || !heroEl) return;
    if (y > heroEl.offsetHeight) return;
    var offset = y * 0.28;
    for (var i = 0; i < heroVisuals.length; i++) {
      heroVisuals[i].style.transform = 'translate3d(0, ' + offset + 'px, 0)';
    }
  }

  // ----------------------------------------------------------
  // 2. SCROLL GRADIENT TRANSITION — Beige → Plum
  // ----------------------------------------------------------
  var stops = [
    { p: 0.0, bg: [232, 214, 201], fg: [74, 45, 35] },
    { p: 0.5, bg: [139, 107, 85], fg: [248, 230, 215] },
    { p: 1.0, bg: [58, 15, 26], fg: [232, 214, 201] }
  ];

  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpColor(c1, c2, t) {
    return [Math.round(lerp(c1[0], c2[0], t)), Math.round(lerp(c1[1], c2[1], t)), Math.round(lerp(c1[2], c2[2], t))];
  }
  function rgb(c) { return 'rgb(' + c[0] + ', ' + c[1] + ', ' + c[2] + ')'; }

  function interpolate(progress) {
    for (var i = 0; i < stops.length - 1; i++) {
      var a = stops[i], b = stops[i + 1];
      if (progress >= a.p && progress <= b.p) {
        var t = (progress - a.p) / (b.p - a.p);
        return { bg: lerpColor(a.bg, b.bg, t), fg: lerpColor(a.fg, b.fg, t) };
      }
    }
    var last = stops[stops.length - 1];
    return { bg: last.bg, fg: last.fg };
  }

  function handleColorTransition(y) {
    if (reduceMotion || !heroEl) return;
    var heroBottom = heroEl.offsetTop + heroEl.offsetHeight;
    var darkTop = darkCollection ? darkCollection.offsetTop : heroBottom + 2000;
    var range = Math.max(1, darkTop - heroBottom);
    var progress = Math.max(0, Math.min(1, (y - heroBottom) / range));
    var c = interpolate(progress);
    root.style.setProperty('--bg-current', rgb(c.bg));
    root.style.setProperty('--fg-current', rgb(c.fg));
    body.classList.toggle('is-dark', progress > 0.55);
  }

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle('is-scrolled', y > 40);
    handleColorTransition(y);
    handleScrollProgress(y);
    handleHeroParallax(y);

    // Fallback: force-reveal the footer when the observer hasn't fired near the end.
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (max - y < 60) {
      var footerTop = document.querySelector('.footer__top');
      if (footerTop && !footerTop.classList.contains('is-revealed')) {
        footerTop.classList.add('is-revealed');
        ['.footer__logo', '.footer__statement'].forEach(function (sel) {
          var el = footerTop.querySelector(sel);
          if (el) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }
        });
      }
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ----------------------------------------------------------
  // 3. MOBILE MENU
  // ----------------------------------------------------------
  var navToggle = document.getElementById('navToggle');
  var navClose = document.getElementById('navClose');
  var mobileMenu = document.getElementById('mobileMenu');

  function openMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
    body.style.overflow = 'hidden';
  }

  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    body.style.overflow = '';
  }

  if (navToggle) navToggle.addEventListener('click', openMenu);
  if (navClose) navClose.addEventListener('click', closeMenu);
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  }

  // ----------------------------------------------------------
  // 4. COUNTDOWN — 48 hr drop, persisted per session
  // ----------------------------------------------------------
  var countdowns = document.querySelectorAll('[data-countdown]');
  if (countdowns.length) {
    var KEY = 'zuve_drop_deadline';
    var deadline;
    try {
      var stored = sessionStorage.getItem(KEY);
      if (stored && Number(stored) > Date.now()) {
        deadline = Number(stored);
      } else {
        deadline = Date.now() + 48 * 60 * 60 * 1000;
        sessionStorage.setItem(KEY, String(deadline));
      }
    } catch (e) {
      deadline = Date.now() + 48 * 60 * 60 * 1000;
    }

    var pad = function (n) { return String(n).padStart(2, '0'); };

    var tick = function () {
      var remaining = Math.max(0, deadline - Date.now());
      var text = pad(Math.floor(remaining / 3600000)) + ':' +
                 pad(Math.floor((remaining % 3600000) / 60000)) + ':' +
                 pad(Math.floor((remaining % 60000) / 1000));
      countdowns.forEach(function (el) { el.textContent = text; });
    };

    tick();
    setInterval(tick, 1000);
  }

  // ----------------------------------------------------------
  // 5. STATS COUNTER — live-ticker loop while in view
  // ----------------------------------------------------------
  var statsRoot = document.getElementById('ritualStats');
  var statsTimers = new Map();

  function startCounterLoop(el) {
    var textNode = Array.prototype.slice.call(el.childNodes).find(function (n) { return n.nodeType === Node.TEXT_NODE; });
    if (!textNode) return;

    var target = Number(el.dataset.count || 0);
    if (reduceMotion) { textNode.nodeValue = String(target); return; }

    var isZero = target === 0;
    var startVal = isZero ? 100 : 0;
    var duration = 1100;
    var holdMs = 900;
    var start = null, rafId = null, timeoutId = null;

    var run = function (now) {
      if (!start) start = now;
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      textNode.nodeValue = String(isZero ? Math.round(startVal - startVal * eased) : Math.round(target * eased));
      if (t < 1) {
        rafId = requestAnimationFrame(run);
      } else {
        timeoutId = setTimeout(function () { start = null; rafId = requestAnimationFrame(run); }, holdMs);
      }
    };

    rafId = requestAnimationFrame(run);
    statsTimers.set(el, {
      stop: function () {
        if (rafId) cancelAnimationFrame(rafId);
        if (timeoutId) clearTimeout(timeoutId);
        textNode.nodeValue = String(target);
      }
    });
  }

  function stopCounterLoop(el) {
    var timer = statsTimers.get(el);
    if (timer) { timer.stop(); statsTimers.delete(el); }
  }

  if (statsRoot && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var fn = entry.isIntersecting ? startCounterLoop : stopCounterLoop;
        entry.target.querySelectorAll('.ritual__num').forEach(fn);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }).observe(statsRoot);
  }

  // ----------------------------------------------------------
  // 6. SCROLL REVEAL
  // ----------------------------------------------------------
  if ('IntersectionObserver' in window) {
    var tileSelector = '.card, .ugc__tile, .trust__item, .club__benefits li, .drop__shades li';
    if (!reduceMotion) {
      document.querySelectorAll(tileSelector).forEach(function (el, i) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = 'opacity 700ms ' + (i * 0.04) + 's cubic-bezier(0.16,1,0.3,1), transform 700ms ' + (i * 0.04) + 's cubic-bezier(0.16,1,0.3,1)';
      });
    }

    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('is-revealed');
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        revealIO.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll(
      '.collection__head, .trust__head, .ugc__head, .ritual__inner, .club__inner, .footer__top, .drop__content, ' + tileSelector
    ).forEach(function (el) { revealIO.observe(el); });
  }

  // ----------------------------------------------------------
  // 7. KINETIC TYPOGRAPHY — split headlines into rising words
  // ----------------------------------------------------------
  function splitIntoWords(el) {
    if (!el || el.dataset.split === '1') return;
    el.dataset.split = '1';

    var fragments = [];
    el.childNodes.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) {
            fragments.push(document.createTextNode(w));
          } else {
            var span = document.createElement('span');
            span.className = 'word';
            span.textContent = w;
            fragments.push(span);
          }
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName.toLowerCase() === 'br') {
          fragments.push(node.cloneNode(true));
        } else {
          var wrap = document.createElement('span');
          wrap.className = 'word';
          wrap.appendChild(node.cloneNode(true));
          fragments.push(wrap);
        }
      }
    });

    el.innerHTML = '';
    fragments.forEach(function (f) { el.appendChild(f); });
    el.querySelectorAll('.word').forEach(function (w, i) {
      w.style.setProperty('--word-delay', (i * 60) + 'ms');
    });
  }

  if (!reduceMotion) {
    document.querySelectorAll('.ritual__inner .display-1, .club__inner .display-1').forEach(splitIntoWords);
  }

  // ----------------------------------------------------------
  // 8. SVG STROKE DRAW-IN — icons stay visible if anything fails
  // ----------------------------------------------------------
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var trustPaths = [];
    document.querySelectorAll('.trust__icon svg').forEach(function (svg) {
      svg.querySelectorAll('path, line, polyline, circle').forEach(function (p) {
        if (typeof p.getTotalLength !== 'function') return;
        var len = 120;
        try { len = p.getTotalLength() || 120; } catch (e) { len = 120; }
        if (!isFinite(len) || !len) len = 120;
        p.style.strokeDasharray = String(len);
        p.style.strokeDashoffset = String(len);
        trustPaths.push(p);
      });
    });

    var safety = setTimeout(function () {
      trustPaths.forEach(function (p) { p.style.strokeDashoffset = '0'; });
    }, 3000);

    var trustIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll('svg path, svg line, svg polyline, svg circle').forEach(function (p) {
          p.style.strokeDashoffset = '0';
        });
        trustIO.unobserve(entry.target);
        clearTimeout(safety);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });

    document.querySelectorAll('.trust__item').forEach(function (el) { trustIO.observe(el); });
  }

  // ----------------------------------------------------------
  // 9. FILTER PILLS — visual state + UGC + homepage tag filtering
  // ----------------------------------------------------------
  document.querySelectorAll('[role="tab"], .ugc__filters .pill').forEach(function (pill) {
    pill.addEventListener('click', function () {
      var group = pill.parentElement;
      if (!group) return;
      group.querySelectorAll('.pill').forEach(function (p) {
        p.classList.remove('is-active');
        p.setAttribute('aria-selected', 'false');
        if (p.hasAttribute('aria-pressed')) p.setAttribute('aria-pressed', 'false');
      });
      pill.classList.add('is-active');
      pill.setAttribute('aria-selected', 'true');
      if (pill.hasAttribute('aria-pressed')) pill.setAttribute('aria-pressed', 'true');
    });
  });

  var ugcBar = document.querySelector('[data-ugc-filter-bar]');
  var ugcGrid = document.querySelector('.ugc__grid');
  if (ugcBar && ugcGrid) {
    var tiles = Array.prototype.slice.call(ugcGrid.querySelectorAll('.ugc__tile'));
    ugcBar.querySelectorAll('.pill[data-filter]').forEach(function (pill) {
      pill.addEventListener('click', function () {
        var filter = pill.getAttribute('data-filter') || 'all';
        tiles.forEach(function (tile) {
          var coll = tile.getAttribute('data-collection');
          tile.classList.toggle('is-hidden', !(filter === 'all' || filter === coll));
        });
      });
    });
  }

  // Homepage tag pills filter the rendered grid without a page load.
  document.querySelectorAll('[data-tag-filter]').forEach(function (pill) {
    pill.addEventListener('click', function () {
      var wanted = pill.getAttribute('data-tag-filter');
      var grid = pill.closest('.collection').querySelector('[data-product-grid]');
      if (!grid) return;
      grid.querySelectorAll('.card').forEach(function (card) {
        var tags = (card.getAttribute('data-tags') || '').split(',');
        card.classList.toggle('is-hidden', wanted !== 'all' && tags.indexOf(wanted) === -1);
      });
    });
  });

  // Storefront facets submit on change (facets themselves are configured in
  // Apps → Search & Discovery, not here).
  var facetForm = document.querySelector('[data-facet-form]');
  if (facetForm) {
    facetForm.addEventListener('change', function () { facetForm.submit(); });
  }

  // ----------------------------------------------------------
  // 10. SMOOTH ANCHOR SCROLLING with nav offset
  // ----------------------------------------------------------
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var navHeight = (nav ? nav.offsetHeight : 0) + 38;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - navHeight + 20,
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
    });
  });

  // ----------------------------------------------------------
  // 11. HERO ORB PARALLAX
  // ----------------------------------------------------------
  if (!reduceMotion && heroEl) {
    var orbs = heroEl.querySelectorAll('.orb');
    var raf = null, pendingX = 0, pendingY = 0;

    heroEl.addEventListener('mousemove', function (e) {
      var rect = heroEl.getBoundingClientRect();
      pendingX = (e.clientX - rect.left) / rect.width - 0.5;
      pendingY = (e.clientY - rect.top) / rect.height - 0.5;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        orbs.forEach(function (orb, i) {
          var depth = (i + 1) * 8;
          orb.style.transform = 'translate3d(' + pendingX * depth + 'px, ' + pendingY * depth + 'px, 0)';
        });
        raf = null;
      });
    });

    heroEl.addEventListener('mouseleave', function () {
      orbs.forEach(function (orb) { orb.style.transform = ''; });
    });
  }

  // ==========================================================
  // 12. CART — AJAX add, slide-in drawer, quantity + remove
  // ==========================================================
  var drawer = document.getElementById('cartDrawer');
  var drawerBody = document.querySelector('[data-cart-drawer-body]');
  var drawerSubtotal = document.querySelector('[data-cart-drawer-subtotal]');
  var cartCounts = document.querySelectorAll('[data-cart-count]');

  function formatMoney(cents) {
    // Shopify's money_format is server-side; this covers the common
    // "{{amount}}"-style patterns well enough for the drawer.
    var format = (window.ZUVE && window.ZUVE.moneyFormat) || '${{amount}}';
    var value = (cents / 100).toFixed(2);
    var parts = value.split('.');
    var withCommas = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return format
      .replace(/\{\{\s*amount_no_decimals_with_comma_separator\s*\}\}/g, withCommas)
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/g, withCommas + ',' + parts[1])
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/g, withCommas)
      .replace(/\{\{\s*amount\s*\}\}/g, withCommas + '.' + parts[1]);
  }

  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    body.classList.add('cart-open');
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    body.classList.remove('cart-open');
  }

  document.querySelectorAll('[data-cart-close]').forEach(function (el) {
    el.addEventListener('click', closeDrawer);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeMenu();
    closeDrawer();
  });

  function renderDrawer(cart) {
    cartCounts.forEach(function (el) { el.textContent = cart.item_count; });
    if (drawerSubtotal) drawerSubtotal.textContent = formatMoney(cart.total_price);
    if (!drawerBody) return;

    if (!cart.items.length) {
      drawerBody.innerHTML = '<p class="cart-drawer__empty">Your bag is empty.</p>';
      return;
    }

    drawerBody.innerHTML = cart.items.map(function (item) {
      var img = item.image ? '<img src="' + item.image.replace(/(\.[a-z]+)(\?|$)/i, '_200x$1$2') + '" alt="" width="72" height="90" loading="lazy">' : '';
      var variant = item.variant_title ? '<span class="cart-item__variant">' + item.variant_title + '</span>' : '';
      return '' +
        '<div class="cart-item" data-key="' + item.key + '">' +
          '<a class="cart-item__media" href="' + item.url + '">' + img + '</a>' +
          '<div class="cart-item__body">' +
            '<a class="cart-item__name" href="' + item.url + '">' + item.product_title + '</a>' +
            variant +
            '<span class="cart-item__price">' + formatMoney(item.final_price) + '</span>' +
            '<div class="cart-item__row">' +
              '<div class="pdp__qty">' +
                '<button class="pdp__qty-btn" type="button" data-cart-qty="-1" aria-label="Decrease quantity">&minus;</button>' +
                '<input class="pdp__qty-num" type="number" min="0" value="' + item.quantity + '" data-cart-qty-input data-key="' + item.key + '">' +
                '<button class="pdp__qty-btn" type="button" data-cart-qty="1" aria-label="Increase quantity">+</button>' +
              '</div>' +
              '<button type="button" class="cart-item__remove link-arrow" data-cart-remove data-key="' + item.key + '">Remove</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  function fetchCart() {
    return fetch('/cart.js', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (cart) { renderDrawer(cart); return cart; });
  }

  function changeLine(key, quantity) {
    return fetch(routes.cart_change_url || '/cart/change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: key, quantity: quantity })
    })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        renderDrawer(cart);
        // The cart page renders server-side; reload it so totals stay honest.
        if (body.classList.contains('template-cart')) window.location.reload();
        return cart;
      });
  }

  function addToCart(formDataOrId, quantity) {
    var payload;
    if (typeof formDataOrId === 'object' && formDataOrId instanceof FormData) {
      payload = { method: 'POST', body: formDataOrId, headers: { Accept: 'application/json' } };
    } else {
      payload = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: [{ id: formDataOrId, quantity: quantity || 1 }] })
      };
    }

    return fetch(routes.cart_add_url || '/cart/add', payload)
      .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.data.description || res.data.message || 'Add to cart failed');
        return fetchCart();
      });
  }

  function flashButton(btn) {
    var label = btn.querySelector('span') || btn;
    var original = label.textContent;
    label.textContent = (window.ZUVE && window.ZUVE.strings && window.ZUVE.strings.addedToBag) || 'Added to bag';
    btn.classList.add('is-added');
    setTimeout(function () {
      label.textContent = original;
      btn.classList.remove('is-added');
    }, 2400);
  }

  // Quick-add from product cards (cards are links, so stop the navigation).
  document.querySelectorAll('[data-quick-add]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      btn.disabled = true;
      addToCart(btn.getAttribute('data-variant-id'), 1)
        .then(function () { flashButton(btn); openDrawer(); })
        .catch(function (err) { console.error(err); })
        .then(function () { btn.disabled = false; });
    });
  });

  // PDP add-to-cart — intercept the real product form.
  var pdpForm = document.getElementById('pdpForm');
  if (pdpForm) {
    pdpForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var submitBtn = pdpForm.querySelector('[data-add-to-cart]');
      if (submitBtn) submitBtn.disabled = true;
      addToCart(new FormData(pdpForm))
        .then(function () {
          document.querySelectorAll('[data-add-to-cart]').forEach(flashButton);
          openDrawer();
        })
        .catch(function (err) { console.error(err); })
        .then(function () { if (submitBtn) submitBtn.disabled = false; });
    });
  }

  // Drawer + cart-page quantity controls (delegated — the drawer re-renders).
  document.addEventListener('click', function (e) {
    var stepper = e.target.closest('[data-cart-qty]');
    if (stepper) {
      var input = stepper.parentElement.querySelector('[data-cart-qty-input]');
      if (!input) return;
      var next = Math.max(0, Number(input.value) + Number(stepper.getAttribute('data-cart-qty')));
      input.value = next;
      changeLine(input.getAttribute('data-key'), next);
      return;
    }

    var remove = e.target.closest('[data-cart-remove]');
    if (remove) {
      e.preventDefault();
      changeLine(remove.getAttribute('data-key'), 0);
    }
  });

  document.addEventListener('change', function (e) {
    var input = e.target.closest('[data-cart-qty-input]');
    if (!input) return;
    changeLine(input.getAttribute('data-key'), Math.max(0, Number(input.value)));
  });

  // Bag icon opens the drawer instead of navigating (progressive enhancement).
  document.querySelectorAll('[data-cart-toggle]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      if (!drawer) return;
      e.preventDefault();
      fetchCart().then(openDrawer);
    });
  });

  if (drawer) fetchCart();
})();
