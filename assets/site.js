/* Bluemoon Innovations — shared behaviour */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* nav: solid after scroll, mobile toggle */
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 40); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    var toggle = nav.querySelector('.nav-toggle');
    var links = nav.querySelector('.nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', function () {
        var open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.textContent = open ? 'Close' : 'Menu';
      });
      links.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = 'Menu'; }
      });
    }
  }

  /* hero moon: waxes on load, keeps filling as you scroll past the hero */
  var hero = document.querySelector('.hero');
  if (hero) {
    var loadLit = reduce ? 0.7 : 0.04, t0 = null;
    var paint = function () {
      var s = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.9)));
      hero.style.setProperty('--lit', Math.min(1, loadLit + 0.3 * s).toFixed(3));
    };
    var rise = function (ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / 2600);
      loadLit = 0.04 + 0.66 * (1 - Math.pow(1 - p, 3));
      paint();
      if (p < 1) requestAnimationFrame(rise);
    };
    paint();
    if (!reduce) requestAnimationFrame(rise);
    window.addEventListener('scroll', paint, { passive: true });
  }

  /* hero: rotate the "someone needs" line with a matching product poster */
  var stage = document.querySelector('.stage');
  if (stage) {
    var cards = [].slice.call(stage.querySelectorAll('.hcard'));
    var dots = [].slice.call(stage.querySelectorAll('.hdot'));
    var needEl = document.getElementById('need-text');
    var cur = 0, timer = null, paused = false;
    var go = function (n) {
      if (n === cur) return;
      var prev = cards[cur];
      prev.classList.remove('on'); prev.classList.add('out'); prev.setAttribute('inert', '');
      setTimeout(function () { prev.classList.remove('out'); }, 800);
      cur = n;
      cards[cur].removeAttribute('inert'); cards[cur].classList.add('on');
      dots.forEach(function (d, i) { d.classList.toggle('on', i === cur); });
      needEl.classList.add('swap');
      setTimeout(function () { needEl.textContent = cards[cur].dataset.need; needEl.classList.remove('swap'); }, 300);
    };
    var start = function () { stop(); if (!reduce) timer = setInterval(function () { if (!paused && !document.hidden) go((cur + 1) % cards.length); }, 4200); };
    var stop = function () { if (timer) clearInterval(timer); timer = null; };
    dots.forEach(function (d) { d.addEventListener('click', function () { go(+d.dataset.i); start(); }); });
    stage.addEventListener('mouseenter', function () { paused = true; });
    stage.addEventListener('mouseleave', function () { paused = false; });
    stage.addEventListener('focusin', function () { paused = true; });
    stage.addEventListener('focusout', function () { paused = false; });
    start();
  }

  /* live download count for Backside */
  var counters = document.querySelectorAll('[data-downloads]');
  if (counters.length && window.fetch) {
    fetch('https://releases.bluemooninnovations.com/api/downloads')
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) {
        if (!d || !d.total) return;
        counters.forEach(function (el) { el.textContent = d.total.toLocaleString() + ' downloads so far'; el.hidden = false; });
      })
      .catch(function () {});
  }

  /* lead capture: announcement bar, teaser, Askade modal (home page only) */
  var teaser = document.getElementById('bm-teaser');
  var overlay = document.getElementById('bm-modal-overlay');
  var iframe = document.getElementById('bm-modal-game');
  var bar = document.getElementById('bm-bar');
  if (!teaser || !overlay || !iframe) return;

  var KEY = 'bm_lead_dismissed';
  var dismissed = function () { try { return sessionStorage.getItem(KEY); } catch (e) { return null; } };
  var lastFocus = null;

  function showBar() { if (dismissed() || !bar) return; bar.classList.add('show'); if (nav) nav.style.top = '44px'; }
  function hideBar() { if (!bar) return; bar.classList.remove('show'); if (nav) nav.style.top = '0'; }
  function showTeaser() { if (!dismissed()) teaser.classList.add('show'); }
  function openModal() {
    if (iframe.getAttribute('src') === 'about:blank') iframe.src = iframe.dataset.src;
    lastFocus = document.activeElement;
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    teaser.classList.remove('show');
    hideBar();
    document.getElementById('bm-modal-close').focus();
  }
  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  function dismiss() {
    teaser.classList.remove('show');
    hideBar();
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
  }

  setTimeout(showBar, 1000);
  var teaserTimer = setTimeout(showTeaser, 7000);
  var scrollFired = false;
  window.addEventListener('scroll', function () {
    if (scrollFired || dismissed()) return;
    var max = document.body.scrollHeight - window.innerHeight;
    if (max > 0 && window.scrollY / max >= 0.35) { scrollFired = true; clearTimeout(teaserTimer); showTeaser(); }
  }, { passive: true });
  document.addEventListener('mouseleave', function onLeave(e) {
    if (e.clientY <= 0 && !dismissed()) { clearTimeout(teaserTimer); showTeaser(); document.removeEventListener('mouseleave', onLeave); }
  });

  if (bar) {
    document.getElementById('bm-bar-cta').addEventListener('click', openModal);
    document.getElementById('bm-bar-close').addEventListener('click', dismiss);
  }
  teaser.addEventListener('click', function (e) { if (e.target.id !== 'bm-teaser-dismiss') openModal(); });
  document.getElementById('bm-teaser-dismiss').addEventListener('click', function (e) { e.stopPropagation(); dismiss(); });
  document.getElementById('bm-modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal(); });
})();
