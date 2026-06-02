/* ============================================================
   ZUVE BEAUTY — INTERACTIONS
   Signature scroll-driven color transition + supporting motion
   ============================================================ */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ----------------------------------------------------------
  // 1. NAVIGATION — sticky scroll behaviour
  // ----------------------------------------------------------
  const nav = document.getElementById('nav');
  let lastY = 0;

  const onScroll = () => {
    const y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle('is-scrolled', y > 40);
    handleColorTransition(y);
    handleScrollProgress(y);
    handleHeroParallax(y);

    // Fallback: Force reveal footer elements when scrolled near the bottom
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (max - y < 60) {
      const footerTop = document.querySelector('.footer__top');
      if (footerTop && !footerTop.classList.contains('is-revealed')) {
        footerTop.classList.add('is-revealed');
        const logo = footerTop.querySelector('.footer__logo');
        const statement = footerTop.querySelector('.footer__statement');
        if (logo) {
          logo.style.opacity = '1';
          logo.style.transform = 'translateY(0)';
        }
        if (statement) {
          statement.style.opacity = '1';
          statement.style.transform = 'translateY(0)';
        }
      }
    }

    lastY = y;
  };

  // Scroll progress 0–1 across the document. Drives the nav underline indicator.
  function handleScrollProgress(y) {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const p = Math.max(0, Math.min(1, y / max));
    root.style.setProperty('--scroll-progress', p.toFixed(3));
  }

  // Hero parallax — translates the image+orb layer at 70% scroll speed while the
  // foreground content scrolls at 100%. Creates real depth without depth-mapping.
  // Skipped when reduced-motion is requested.
  const heroSoftVisual = document.querySelector('.hero__panel--soft .hero__visual');
  const heroDarkVisual = document.querySelector('.hero__panel--dark .hero__visual');

  function handleHeroParallax(y) {
    if (reduceMotion || !heroEl) return;
    const heroH = heroEl.offsetHeight;
    if (y > heroH) return; // out of view, no work needed
    // Image layer moves DOWN at 0.3x scroll speed → effective ascent is 0.7x.
    const offset = y * 0.28;
    if (heroSoftVisual) heroSoftVisual.style.transform = `translate3d(0, ${offset}px, 0)`;
    if (heroDarkVisual) heroDarkVisual.style.transform = `translate3d(0, ${offset}px, 0)`;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ----------------------------------------------------------
  // 2. MOBILE MENU
  // ----------------------------------------------------------
  const navToggle = document.getElementById('navToggle');
  const navClose = document.getElementById('navClose');
  const mobileMenu = document.getElementById('mobileMenu');

  const openMenu = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    navToggle && navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    navToggle && navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  navToggle && navToggle.addEventListener('click', openMenu);
  navClose && navClose.addEventListener('click', closeMenu);
  mobileMenu &&
    mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // ----------------------------------------------------------
  // 3. SCROLL GRADIENT TRANSITION — Beige → Plum
  //    PRD Section 2: signature interaction
  // ----------------------------------------------------------
  const root = document.documentElement;
  const body = document.body;

  // Color stops along the journey (HSL/RGB interpolated manually)
  // 0% scroll  → Soft Beige (#E8D6C9 / #4A2D23 text)
  // 30% scroll → Warm mid  (#8B6B55 / #2A1A12 text)
  // 60%+ scroll → Deep Plum (#3A0F1A / #E8D6C9 text)

  const stops = [
    { p: 0.0, bg: [232, 214, 201], fg: [74, 45, 35]   }, // beige
    { p: 0.5, bg: [139, 107, 85],  fg: [248, 230, 215] }, // mid
    { p: 1.0, bg: [58, 15, 26],    fg: [232, 214, 201] }, // plum
  ];

  const lerp = (a, b, t) => a + (b - a) * t;
  const lerpColor = (c1, c2, t) => [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
  const rgb = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

  function interpolate(progress) {
    // Find segment
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      if (progress >= a.p && progress <= b.p) {
        const t = (progress - a.p) / (b.p - a.p);
        return { bg: lerpColor(a.bg, b.bg, t), fg: lerpColor(a.fg, b.fg, t) };
      }
    }
    const last = stops[stops.length - 1];
    return { bg: last.bg, fg: last.fg };
  }

  // Color transition runs between end of hero and start of dark collection
  const heroEl = document.querySelector('.hero');
  const darkCollection = document.getElementById('dark-siren');

  function handleColorTransition(y) {
    if (reduceMotion || !heroEl) return;

    const heroBottom = heroEl.offsetTop + heroEl.offsetHeight;
    const darkTop = darkCollection ? darkCollection.offsetTop : heroBottom + 2000;
    const range = Math.max(1, darkTop - heroBottom);
    let progress = (y - heroBottom) / range;
    progress = Math.max(0, Math.min(1, progress));

    const { bg, fg } = interpolate(progress);
    root.style.setProperty('--bg-current', rgb(bg));
    root.style.setProperty('--fg-current', rgb(fg));

    // Flag for nav background contrast (past the visual midpoint)
    if (progress > 0.55) {
      body.classList.add('is-dark');
    } else {
      body.classList.remove('is-dark');
    }
  }



  // ----------------------------------------------------------
  // 5. COUNTDOWN TIMERS — 48 hr drop
  // ----------------------------------------------------------
  const announceCountdown = document.getElementById('announceCountdown');
  const dropCountdown = document.getElementById('dropCountdown');

  // Set deadline 48h from first visit (persists per-session, falls back gracefully)
  const KEY = 'zuve_drop_deadline';
  let deadline;
  try {
    const stored = sessionStorage.getItem(KEY);
    if (stored && Number(stored) > Date.now()) {
      deadline = Number(stored);
    } else {
      deadline = Date.now() + 48 * 60 * 60 * 1000;
      sessionStorage.setItem(KEY, String(deadline));
    }
  } catch (e) {
    deadline = Date.now() + 48 * 60 * 60 * 1000;
  }

  const pad = (n) => String(n).padStart(2, '0');

  function tickCountdown() {
    const remaining = Math.max(0, deadline - Date.now());
    const hours = Math.floor(remaining / 3_600_000);
    const minutes = Math.floor((remaining % 3_600_000) / 60_000);
    const seconds = Math.floor((remaining % 60_000) / 1000);

    const text = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    if (announceCountdown) announceCountdown.textContent = text;
    if (dropCountdown) dropCountdown.textContent = text;
    const dropCountdown2 = document.getElementById('dropCountdown2');
    if (dropCountdown2) dropCountdown2.textContent = text;
  }

  tickCountdown();
  setInterval(tickCountdown, 1000);

  // ----------------------------------------------------------
  // 6. STATS COUNTER — section 6, IntersectionObserver loop
  // ----------------------------------------------------------
  const statsRoot = document.getElementById('ritualStats');
  const statsTimers = new Map();

  function startCounterLoop(el) {
    const textNode = Array.from(el.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
    if (!textNode) return;

    const target = Number(el.dataset.count || 0);
    if (reduceMotion) {
      textNode.nodeValue = String(target);
      return;
    }

    const isZero = target === 0;
    const startVal = isZero ? 100 : 0;
    // Real-time loop pacing: faster count-up, brief hold at target,
    // then quick reset so the numbers feel like a live ticker.
    const duration = 1100;
    const holdMs = 900;

    let start = null;
    let rafId = null;
    let timeoutId = null;

    const run = (now) => {
      if (!start) start = now;
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOut cubic

      const value = isZero
        ? Math.round(startVal - (startVal * eased))
        : Math.round(target * eased);

      textNode.nodeValue = String(value);

      if (t < 1) {
        rafId = requestAnimationFrame(run);
      } else {
        timeoutId = setTimeout(() => {
          start = null;
          rafId = requestAnimationFrame(run);
        }, holdMs);
      }
    };

    rafId = requestAnimationFrame(run);

    statsTimers.set(el, {
      stop: () => {
        if (rafId) cancelAnimationFrame(rafId);
        if (timeoutId) clearTimeout(timeoutId);
        textNode.nodeValue = String(target);
      }
    });
  }

  function stopCounterLoop(el) {
    const timer = statsTimers.get(el);
    if (timer) {
      timer.stop();
      statsTimers.delete(el);
    }
  }

  if (statsRoot && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.ritual__num').forEach(startCounterLoop);
          } else {
            entry.target.querySelectorAll('.ritual__num').forEach(stopCounterLoop);
          }
        });
      },
      // Lower threshold + early rootMargin so the count fires reliably
      // even on tall viewports where 25% is hard to reach.
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    );
    io.observe(statsRoot);
  }

  // ----------------------------------------------------------
  // 7. SCROLL REVEAL — adds .is-revealed when targets enter viewport.
  //    Triggers staggered card/tile fades, eyebrow underlines, SVG
  //    stroke draw-ins, and word-by-word headline reveals.
  // ----------------------------------------------------------
  if ('IntersectionObserver' in window) {
    // Card / tile / list reveal targets (the existing pattern + new groups)
    const tileTargets = document.querySelectorAll(
      '.card, .ugc__tile, .trust__item, .club__benefits li, .drop__shades li'
    );

    tileTargets.forEach((el, i) => {
      if (reduceMotion) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = `opacity 700ms ${i * 0.04}s cubic-bezier(0.16,1,0.3,1), transform 700ms ${i * 0.04}s cubic-bezier(0.16,1,0.3,1)`;
    });

    // Section-level targets get .is-revealed (drives eyebrow underline,
    // SVG draw, kinetic words, footer entrance, etc).
    const sectionTargets = document.querySelectorAll(
      '.collection__head, .trust__head, .ugc__head, ' +
      '.ritual__inner, .club__inner, .footer__top, .drop__content, ' +
      '.card, .ugc__tile, .trust__item, .club__benefits li, .drop__shades li'
    );

    const revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            el.classList.add('is-revealed');
            // Keep the inline-style reveal for back-compat with reduced-motion
            // fallback paths (tile targets only).
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            revealIO.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    sectionTargets.forEach((el) => revealIO.observe(el));
  }

  // ----------------------------------------------------------
  // 7c. KINETIC TYPOGRAPHY — split headlines into word-wrappers
  //     so each word can rise independently on viewport entry.
  //     Applied to the Ritual headline and Ritual Club headline.
  // ----------------------------------------------------------
  function splitIntoWords(el) {
    if (!el || el.dataset.split === '1') return;
    el.dataset.split = '1';

    // Walk top-level text nodes + em children, wrap each word in a span.
    const fragments = [];
    el.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const words = node.textContent.split(/(\s+)/);
        words.forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) {
            fragments.push(document.createTextNode(w));
          } else {
            const span = document.createElement('span');
            span.className = 'word';
            span.textContent = w;
            fragments.push(span);
          }
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();
        if (tag === 'br') {
          fragments.push(node.cloneNode(true));
        } else {
          // Wrap the entire em/strong/etc as a word so italic styling
          // is preserved as a single rising unit.
          const span = document.createElement('span');
          span.className = 'word';
          span.appendChild(node.cloneNode(true));
          fragments.push(span);
        }
      }
    });

    el.innerHTML = '';
    fragments.forEach((f) => el.appendChild(f));

    // Apply a per-word stagger delay via CSS custom property.
    const words = el.querySelectorAll('.word');
    words.forEach((w, i) => {
      w.style.setProperty('--word-delay', `${i * 60}ms`);
    });
  }

  if (!reduceMotion) {
    splitIntoWords(document.querySelector('.ritual #ritualLabel'));
    splitIntoWords(document.querySelector('.club #clubLabel'));
  }

  // ----------------------------------------------------------
  // 7d. SVG STROKE DRAW-IN — per-path calibrated lengths.
  //     CSS now leaves the icons VISIBLE by default. We only hide
  //     them (via dashoffset = path length) right before the
  //     observer is wired, so if anything fails the icons stay drawn.
  //     A safety timeout also forces them visible after 3s in case
  //     the observer never fires (e.g. section never reaches viewport).
  // ----------------------------------------------------------
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const trustPaths = [];
    document.querySelectorAll('.trust__icon svg').forEach((svg) => {
      svg.querySelectorAll('path, line, polyline, circle').forEach((p) => {
        if (typeof p.getTotalLength !== 'function') return;
        let len = 0;
        try { len = p.getTotalLength(); } catch (e) { len = 120; }
        if (!len || !isFinite(len)) len = 120;
        p.style.strokeDasharray = String(len);
        p.style.strokeDashoffset = String(len);
        trustPaths.push(p);
      });
    });

    // Safety net: if the observer never fires within 3s of init, force
    // all icons visible. Better to skip the draw-in than to ship a page
    // with empty circular wells.
    const safety = setTimeout(() => {
      trustPaths.forEach((p) => { p.style.strokeDashoffset = '0'; });
    }, 3000);

    // When the trust__item enters viewport, walk its paths and set
    // dashoffset to 0 — the CSS transition handles the animation.
    const trustIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('svg path, svg line, svg polyline, svg circle').forEach((p) => {
              p.style.strokeDashoffset = '0';
            });
            trustIO.unobserve(entry.target);
            clearTimeout(safety);
          }
        });
      },
      // Lower threshold + early rootMargin so it fires reliably.
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    );
    document.querySelectorAll('.trust__item').forEach((el) => trustIO.observe(el));
  }

  // ----------------------------------------------------------
  // 7b. HERO IMAGES — graceful degradation. If the optional photography
  //     isn't on disk yet, remove the broken-image icon so the CSS orbs
  //     carry the panel on their own.
  // ----------------------------------------------------------
  document.querySelectorAll('.hero__img').forEach((img) => {
    const hide = () => img.remove();
    if (img.complete && img.naturalWidth === 0) {
      hide();
    } else {
      img.addEventListener('error', hide, { once: true });
    }
  });

  // ----------------------------------------------------------
  // 7e. PRODUCT-CARD NAVIGATION + SHADE STRIP
  //     - Wires landing-page cards to their dedicated /products/<slug>.html
  //     - Injects a 4-dot shade swatch strip below each card meta that
  //       fades in on hover (per audit: "3-4 shade swatch dots showing
  //       other available shades — turns browsing into a conversion moment")
  // ----------------------------------------------------------
  const SOFT_SHADES = ['#E8D6C9', '#EAD0CB', '#E0CCB8', '#C9A5A2', '#D4A89F', '#D9B8A3'];
  const DARK_SHADES = ['#8A0E17', '#5B1421', '#3A0F1A', '#6B0F1F', '#2A0810'];

  document.querySelectorAll('.card').forEach((card) => {
    const nameEl = card.querySelector('.card__name');
    if (!nameEl) return;

    // --- Slug + navigation ---
    const slug = nameEl.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const href = `products/${slug}.html`;

    card.style.cursor = 'pointer';
    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `View ${nameEl.textContent.trim()}`);

    const go = () => { window.location.href = href; };

    card.addEventListener('click', (e) => {
      if (e.target.closest('.card__quick')) return;
      go();
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });

    const quickBtn = card.querySelector('.card__quick');
    if (quickBtn) {
      quickBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        go();
      });
    }

    // --- Shade-strip injection ---
    // Skip if already injected (avoid duplicates on hot-reload).
    if (card.querySelector('.card__shade-strip')) return;

    const isDark = card.classList.contains('card--dark') ||
                   card.closest('.collection--dark') !== null;
    const palette = isDark ? DARK_SHADES : SOFT_SHADES;

    // Filter out the current card's own shade by name match, then pick 4.
    // We don't have exact hex mapping per card, so we pick the first 4
    // shades from the collection — works visually as a "more shades"
    // indicator without per-card data.
    const strip = document.createElement('div');
    strip.className = 'card__shade-strip';
    strip.setAttribute('aria-hidden', 'true');

    palette.slice(0, 4).forEach((color) => {
      const dot = document.createElement('span');
      dot.className = 'card__shade-dot';
      dot.style.background = color;
      strip.appendChild(dot);
    });

    const overflow = document.createElement('span');
    overflow.className = 'card__shade-more';
    overflow.textContent = `+${palette.length - 4} more`;
    strip.appendChild(overflow);

    const media = card.querySelector('.card__media');
    if (media) {
      media.appendChild(strip);
    } else {
      card.appendChild(strip);
    }
  });

  // ----------------------------------------------------------
  // 8. FILTER PILLS
  //    Generic visual-state toggle for any [role="tab"] group, plus
  //    real UGC filtering — All / #ZuveSoftMuse / #ZuveDarkSiren.
  //    Tiles are tagged with data-collection="soft|dark"; pills with
  //    data-filter="all|soft|dark". Non-matching tiles get .is-hidden
  //    (CSS animates opacity + scale, then sets display:none).
  // ----------------------------------------------------------
  document.querySelectorAll('[role="tab"], .ugc__filters .pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      const group = pill.parentElement;
      if (!group) return;
      group.querySelectorAll('.pill').forEach((p) => {
        p.classList.remove('is-active');
        p.setAttribute('aria-selected', 'false');
        if (p.hasAttribute('aria-pressed')) p.setAttribute('aria-pressed', 'false');
      });
      pill.classList.add('is-active');
      pill.setAttribute('aria-selected', 'true');
      if (pill.hasAttribute('aria-pressed')) pill.setAttribute('aria-pressed', 'true');
    });
  });

  const ugcBar = document.querySelector('[data-ugc-filter-bar]');
  const ugcGrid = document.querySelector('.ugc__grid');
  if (ugcBar && ugcGrid) {
    const tiles = Array.from(ugcGrid.querySelectorAll('.ugc__tile'));
    ugcBar.querySelectorAll('.pill[data-filter]').forEach((pill) => {
      pill.addEventListener('click', () => {
        const filter = pill.getAttribute('data-filter') || 'all';
        tiles.forEach((tile) => {
          const coll = tile.getAttribute('data-collection');
          const show = filter === 'all' || filter === coll;
          tile.classList.toggle('is-hidden', !show);
        });
      });
    });
  }

  // ----------------------------------------------------------
  // 9. RITUAL CLUB FORM — light client-side validation, branded msg
  // ----------------------------------------------------------
  const ritualForm = document.getElementById('ritualForm');
  const ritualMsg = document.getElementById('ritualMessage');
  const emailInput = document.getElementById('ritualEmail');

  if (ritualForm && emailInput && ritualMsg) {
    ritualForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = emailInput.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

      if (!valid) {
        ritualMsg.textContent = 'Please enter a valid email to begin the ritual.';
        ritualMsg.style.color = '#D9B8A3';
        emailInput.focus();
        return;
      }

      ritualForm.style.opacity = '0.4';
      ritualForm.style.pointerEvents = 'none';
      ritualMsg.textContent = 'The ritual has begun. Check your inbox for a welcome.';
      ritualMsg.style.color = '#E8D6C9';

      setTimeout(() => {
        emailInput.value = '';
        ritualForm.style.opacity = '';
        ritualForm.style.pointerEvents = '';
      }, 4000);
    });
  }

  // ----------------------------------------------------------
  // 10. SMOOTH ANCHOR SCROLLING with nav offset
  // ----------------------------------------------------------
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const navHeight = (nav ? nav.offsetHeight : 0) + 38;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight + 20;
      window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });

  // ----------------------------------------------------------
  // 11. PARALLAX HERO ORBS (subtle, perf-conscious)
  // ----------------------------------------------------------
  if (!reduceMotion && heroEl) {
    const orbs = heroEl.querySelectorAll('.orb');
    let raf = null;
    let pendingX = 0;
    let pendingY = 0;

    heroEl.addEventListener('mousemove', (e) => {
      const rect = heroEl.getBoundingClientRect();
      pendingX = (e.clientX - rect.left) / rect.width - 0.5;
      pendingY = (e.clientY - rect.top) / rect.height - 0.5;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          orbs.forEach((orb, i) => {
            const depth = (i + 1) * 8;
            orb.style.transform = `translate3d(${pendingX * depth}px, ${pendingY * depth}px, 0)`;
          });
          raf = null;
        });
      }
    });

    heroEl.addEventListener('mouseleave', () => {
      orbs.forEach((orb) => (orb.style.transform = ''));
    });
  }
})();
