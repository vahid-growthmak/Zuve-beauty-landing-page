/* ============================================================
   ZUVE BEAUTY — PRODUCT PAGE
   Gallery, quantity, variant selection, sticky CTA.
   All product data comes from Liquid; this file only reacts.
   ============================================================ */

(function () {
  'use strict';

  // ----------------------------------------------------------
  // QUANTITY
  // ----------------------------------------------------------
  var qtyInput = document.getElementById('pdpQty');
  if (qtyInput) {
    document.querySelectorAll('[data-qty]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = Number(qtyInput.value) + Number(btn.dataset.qty);
        qtyInput.value = Math.max(1, Math.min(99, next));
      });
    });
  }

  // ----------------------------------------------------------
  // GALLERY THUMBNAILS — swap the hero image
  // ----------------------------------------------------------
  var thumbs = document.querySelectorAll('.pdp__thumb');
  var heroImg = document.querySelector('[data-hero-img]');

  thumbs.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      thumbs.forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      thumb.classList.add('is-active');
      thumb.setAttribute('aria-selected', 'true');

      var img = thumb.querySelector('.pdp__thumb-img');
      if (heroImg && img) {
        heroImg.removeAttribute('srcset');
        heroImg.setAttribute('src', img.getAttribute('data-full') || img.getAttribute('src'));
        heroImg.setAttribute('alt', img.getAttribute('alt') || '');
      }
    });
  });

  // ----------------------------------------------------------
  // VARIANT SELECTION — matches option values against the JSON table
  // ----------------------------------------------------------
  var variantScript = document.querySelector('[data-variant-json]');
  var variantInput = document.querySelector('[data-variant-input]');
  var selectors = document.querySelectorAll('[data-option-selector]');

  if (variantScript && variantInput && selectors.length) {
    var variants = [];
    try { variants = JSON.parse(variantScript.textContent); } catch (e) { variants = []; }

    var update = function () {
      var chosen = Array.prototype.map.call(selectors, function (s) { return s.value; });
      var match = variants.find(function (v) {
        return chosen.every(function (value, i) { return v.options[i] === value; });
      });
      if (!match) return;

      variantInput.value = match.id;

      document.querySelectorAll('[data-price]').forEach(function (el) { el.innerHTML = match.price; });
      var titleEl = document.querySelector('[data-variant-title]');
      if (titleEl) titleEl.textContent = match.title;

      document.querySelectorAll('[data-add-to-cart]').forEach(function (btn) {
        btn.disabled = !match.available;
        var label = btn.querySelector('span');
        if (label && !match.available) label.textContent = (window.ZUVE && window.ZUVE.strings.soldOut) || 'Sold out';
      });

      // Keep the URL shareable — same behaviour as Shopify's own themes.
      if (window.history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.set('variant', match.id);
        window.history.replaceState({}, '', url.toString());
      }
    };

    selectors.forEach(function (s) { s.addEventListener('change', update); });
  }

  // ----------------------------------------------------------
  // STICKY CTA — appears once the buy block scrolls past the top
  // ----------------------------------------------------------
  var sticky = document.getElementById('pdpSticky');
  var buyBlock = document.querySelector('.pdp__buy');

  if (sticky && buyBlock && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var out = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        sticky.classList.toggle('is-visible', out);
        sticky.setAttribute('aria-hidden', out ? 'false' : 'true');
      });
    }, { threshold: 0 }).observe(buyBlock);
  }

  // ----------------------------------------------------------
  // REVIEW SORT PILLS — verified-only filter, client side
  // ----------------------------------------------------------
  var reviewList = document.querySelector('[data-review-list]');
  if (reviewList) {
    document.querySelectorAll('[data-review-sort]').forEach(function (pill) {
      pill.addEventListener('click', function () {
        var mode = pill.getAttribute('data-review-sort');
        reviewList.querySelectorAll('.pdp-review-card').forEach(function (card) {
          var verified = card.getAttribute('data-verified') === 'true';
          card.classList.toggle('is-hidden', mode === 'verified' && !verified);
        });
      });
    });
  }
})();
