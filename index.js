/* =============================================================================
   Elique Events — behaviour
   -----------------------------------------------------------------------------
   Each feature lives in its own init function and bails out quietly when the
   markup it needs is absent, so the file is safe to load on any page.
   ========================================================================== */
(function () {
  'use strict';

  /* Signals to CSS that JS is running, so scroll-reveal styles can apply.
     Without this, a JS failure would leave the page permanently invisible. */
  document.documentElement.classList.add('js');

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var SMALL_SCREEN = '(max-width: 767px)';

  /* --- helpers ----------------------------------------------------------- */
  function $(selector, scope) { return (scope || document).querySelector(selector); }
  function $$(selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); }

  function onReady(fn) {
    if (document.readyState !== 'loading') { fn(); }
    else { document.addEventListener('DOMContentLoaded', fn, { once: true }); }
  }

  /* ===========================================================================
     Mobile navigation
     ======================================================================== */
  function initMobileNav() {
    var toggle = $('#nav-toggle');
    var drawer = $('#nav-drawer');
    if (!toggle || !drawer) { return; }

    var isOpen = false;

    function setOpen(next) {
      if (next === isOpen) { return; }
      isOpen = next;
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');

      if (isOpen) {
        drawer.hidden = false;
        // Force a reflow so the grid-template-rows transition actually runs.
        void drawer.offsetHeight;
        drawer.classList.add('is-open');
      } else {
        drawer.classList.remove('is-open');
        var hide = function () { if (!isOpen) { drawer.hidden = true; } };
        if (prefersReducedMotion.matches) { hide(); }
        else { window.setTimeout(hide, 320); }
      }
    }

    toggle.addEventListener('click', function () { setOpen(!isOpen); });

    // Close after choosing a destination.
    drawer.addEventListener('click', function (event) {
      if (event.target.closest('a')) { setOpen(false); }
    });

    // Close on outside click, but only when the menu is actually open.
    document.addEventListener('click', function (event) {
      if (!isOpen) { return; }
      if (drawer.contains(event.target) || toggle.contains(event.target)) { return; }
      setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Reset when the layout switches back to the desktop navigation.
    var desktop = window.matchMedia('(min-width: 1025px)');
    desktop.addEventListener('change', function (event) {
      if (event.matches) { setOpen(false); }
    });
  }

  /* ===========================================================================
     Header state + active section highlighting
     ======================================================================== */
  function initHeader() {
    var header = $('#site-header');
    if (!header) { return; }

    var ticking = false;
    function onScroll() {
      if (ticking) { return; }
      ticking = true;
      window.requestAnimationFrame(function () {
        header.classList.toggle('is-scrolled', window.scrollY > 24);
        ticking = false;
      });
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initScrollSpy() {
    var links = $$('.nav__link[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) { return; }

    // Map every section id to all the links that point at it (the desktop nav
    // and the mobile drawer both contain one).
    var byId = {};
    links.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      if (!document.getElementById(id)) { return; }
      (byId[id] = byId[id] || []).push(link);
    });

    var ids = Object.keys(byId);
    if (!ids.length) { return; }

    var visible = {};

    function render() {
      var current = null;
      for (var i = 0; i < ids.length; i++) {
        if (visible[ids[i]]) { current = ids[i]; break; }
      }
      ids.forEach(function (id) {
        byId[id].forEach(function (link) {
          if (id === current) { link.setAttribute('aria-current', 'true'); }
          else { link.removeAttribute('aria-current'); }
        });
      });
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { visible[entry.target.id] = entry.isIntersecting; });
      render();
    }, {
      // Trim the fixed header off the top and require the section to occupy
      // the upper part of the viewport before it counts as "current".
      rootMargin: '-45% 0px -50% 0px',
      threshold: 0
    });

    ids.forEach(function (id) { observer.observe(document.getElementById(id)); });
  }

  /* ===========================================================================
     Testimonial carousel
     ---------------------------------------------------------------------------
     One source of truth: `index`. The previous version kept state in hidden
     radio inputs *and* in JS, and hard-coded the slide count in four CSS rules.
     ======================================================================== */
  function initCarousel() {
    var root = $('#carousel');
    if (!root) { return; }

    var track = $('[data-carousel-track]', root);
    var viewport = $('[data-carousel-viewport]', root);
    var dotsHost = $('[data-carousel-dots]', root);
    var toggleBtn = $('[data-carousel-toggle]', root);
    var slides = $$('.carousel__slide', track);
    if (slides.length < 2) {
      if (dotsHost) { dotsHost.hidden = true; }
      if (toggleBtn) { toggleBtn.hidden = true; }
      return;
    }

    var delay = parseInt(root.getAttribute('data-autoplay'), 10) || 6000;
    var index = 0;
    var timer = null;
    var userPaused = false;

    /* --- dots ------------------------------------------------------------ */
    var dots = slides.map(function (_, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel__dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Testimonial ' + (i + 1) + ' of ' + slides.length);
      dot.addEventListener('click', function () {
        goTo(i);
        restart();
      });
      dotsHost.appendChild(dot);
      return dot;
    });

    /* --- rendering ------------------------------------------------------- */
    function goTo(next) {
      index = (next + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-index * 100) + '%)';

      slides.forEach(function (slide, i) {
        // `inert` removes off-screen slides from the tab order and the
        // accessibility tree without hiding them mid-transition.
        if (i === index) { slide.removeAttribute('inert'); }
        else { slide.setAttribute('inert', ''); }
      });

      dots.forEach(function (dot, i) {
        dot.setAttribute('aria-selected', String(i === index));
      });
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    /* --- autoplay -------------------------------------------------------- */
    function stop() {
      window.clearInterval(timer);
      timer = null;
    }

    function start() {
      stop();
      if (userPaused || prefersReducedMotion.matches || document.hidden) { return; }
      timer = window.setInterval(next, delay);
    }

    function restart() { if (!userPaused) { start(); } }

    if (toggleBtn) {
      toggleBtn.setAttribute('aria-pressed', 'false');
      toggleBtn.addEventListener('click', function () {
        userPaused = !userPaused;
        toggleBtn.setAttribute('aria-pressed', String(userPaused));
        toggleBtn.setAttribute('aria-label', userPaused ? 'Play testimonials' : 'Pause testimonials');
        if (userPaused) { stop(); } else { start(); }
      });
    }

    $$('[data-carousel-next]', root).forEach(function (btn) {
      btn.addEventListener('click', function () { next(); restart(); });
    });
    $$('[data-carousel-prev]', root).forEach(function (btn) {
      btn.addEventListener('click', function () { prev(); restart(); });
    });

    // Pause while the visitor is reading or interacting.
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', restart);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', function (event) {
      if (!root.contains(event.relatedTarget)) { restart(); }
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); } else { restart(); }
    });

    /* --- keyboard -------------------------------------------------------- */
    root.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight') { event.preventDefault(); next(); restart(); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); prev(); restart(); }
    });

    /* --- pointer / touch swipe ------------------------------------------- */
    // Pointer Events cover touch, pen and mouse drag in one code path.
    var startX = 0;
    var startY = 0;
    var dragging = false;

    viewport.addEventListener('pointerdown', function (event) {
      if (event.pointerType === 'mouse' && event.button !== 0) { return; }
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      stop();
    });

    viewport.addEventListener('pointerup', function (event) {
      if (!dragging) { return; }
      dragging = false;
      var dx = event.clientX - startX;
      var dy = event.clientY - startY;
      // Ignore mostly-vertical gestures so page scrolling still works.
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) { next(); } else { prev(); }
      }
      restart();
    });

    viewport.addEventListener('pointercancel', function () {
      dragging = false;
      restart();
    });

    prefersReducedMotion.addEventListener('change', start);

    goTo(0);
    start();
  }

  /* ===========================================================================
     Background videos
     ---------------------------------------------------------------------------
     Nothing downloads until the video is near the viewport, the small
     rendition is used on phones, and playback stops once it scrolls away.
     ======================================================================== */
  function initBackgroundVideos() {
    var videos = $$('.js-bg-video');
    if (!videos.length) { return; }

    var small = window.matchMedia(SMALL_SCREEN);
    var saveData = navigator.connection && navigator.connection.saveData;

    function source(video) {
      var sm = video.getAttribute('data-src-sm');
      return (small.matches && sm) ? sm : video.getAttribute('data-src');
    }

    function load(video) {
      if (video.dataset.loaded === 'true') { return; }
      var src = source(video);
      if (!src) { return; }
      video.dataset.loaded = 'true';
      video.src = src;
      // Safari on iOS can reject play() when it is called in the same tick as
      // load(), before any data has arrived. Trying again once the first frame
      // is decoded covers that.
      video.addEventListener('loadeddata', function () { play(video); }, { once: true });
      video.load();
    }

    // Videos whose autoplay was refused, kept so a later gesture can start them.
    var blocked = [];

    function play(video) {
      // iOS only honours autoplay when these are set as properties. The HTML
      // attributes are not always enough once src is assigned from JavaScript,
      // which is exactly what happens here.
      video.muted = true;
      video.playsInline = true;

      var attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(function () {
          // Refused — battery saver, iOS Low Power Mode or a strict autoplay
          // policy. The poster frame stays visible, and the first deliberate
          // interaction gets another go.
          if (blocked.indexOf(video) === -1) { blocked.push(video); }
        });
      }
    }

    // A user gesture lifts the autoplay restriction. Draining the list keeps
    // this a no-op once everything is playing.
    function retryBlocked() {
      blocked.splice(0).forEach(function (video) {
        video.muted = true;
        var attempt = video.play();
        if (attempt && typeof attempt.catch === 'function') { attempt.catch(function () {}); }
      });
    }

    ['pointerdown', 'touchend', 'keydown'].forEach(function (type) {
      window.addEventListener(type, retryBlocked, { passive: true });
    });

    // Reduced motion or Data Saver: keep the poster frame, skip the download.
    if (prefersReducedMotion.matches || saveData) { return; }

    if (!('IntersectionObserver' in window)) {
      videos.forEach(function (video) { load(video); play(video); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        if (entry.isIntersecting) {
          load(video);
          play(video);
        } else if (!video.paused) {
          video.pause();
        }
      });
    }, { rootMargin: '200px 0px', threshold: 0.01 });

    videos.forEach(function (video) { observer.observe(video); });
  }

  /* ===========================================================================
     Continuous backdrop
     ---------------------------------------------------------------------------
     The photo behind the middle four sections is one tall image on a sticky
     layer. As the group scrolls past, the image pans from its top edge to its
     bottom edge, so the visitor travels down through the venue — lighting rig,
     then the beams, then the seating.

     Only a transform is touched, so the browser can keep this on the
     compositor and never repaints the image itself.
     ======================================================================== */
  function initBackdrop() {
    var root = $('[data-backdrop]');
    if (!root) { return; }

    var frame = $('.backdrop__frame', root);
    var img = $('.backdrop__img', root);
    if (!frame || !img) { return; }

    // The stylesheet parks the image at a fixed position for reduced motion.
    if (prefersReducedMotion.matches) { return; }

    var start = 0;
    var range = 1;
    var travel = 0;
    var ticking = false;

    function measure() {
      start = root.getBoundingClientRect().top + window.scrollY;
      // How far the group scrolls while the sticky frame is pinned.
      range = Math.max(1, root.offsetHeight - frame.offsetHeight);
      // How much taller the image is than the frame — the distance to pan.
      travel = Math.max(0, img.offsetHeight - frame.offsetHeight);
    }

    function apply() {
      ticking = false;
      if (!travel) { return; }
      var progress = (window.scrollY - start) / range;
      progress = progress < 0 ? 0 : progress > 1 ? 1 : progress;
      img.style.setProperty('--backdrop-pan', (-progress * travel).toFixed(1) + 'px');
    }

    function onScroll() {
      if (ticking) { return; }
      ticking = true;
      window.requestAnimationFrame(apply);
    }

    function refresh() {
      measure();
      apply();
    }

    refresh();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', refresh, { passive: true });
    window.addEventListener('orientationchange', refresh);

    // Section heights change as fonts swap in and lazy images arrive.
    if ('ResizeObserver' in window) {
      new ResizeObserver(refresh).observe(root);
    } else {
      window.addEventListener('load', refresh);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(refresh);
    }
  }

  /* ===========================================================================
     Contact form
     ---------------------------------------------------------------------------
     Submits over fetch so the visitor stays on the page. If fetch fails for
     any reason the form falls back to a normal browser submission.
     ======================================================================== */
  function initContactForm() {
    var form = $('#contact-form');
    if (!form || !window.fetch) { return; }

    var status = $('[data-form-status]', form);
    var button = $('[data-submit]', form);
    var label = $('[data-submit-label]', form);
    var fields = $$('.field__input', form);

    function errorFor(field) { return $('[data-error-for="' + field.id + '"]', form); }

    function validate(field) {
      var ok = field.checkValidity();
      var message = errorFor(field);
      field.setAttribute('aria-invalid', String(!ok));
      if (message) {
        message.hidden = ok;
        if (ok || !message.id) { field.removeAttribute('aria-describedby'); }
        else { field.setAttribute('aria-describedby', message.id); }
      }
      return ok;
    }

    fields.forEach(function (field) {
      // Only nag after the visitor has left the field once.
      field.addEventListener('blur', function () { validate(field); });
      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true') { validate(field); }
      });
    });

    function setStatus(text, kind) {
      if (!status) { return; }
      status.textContent = text;
      status.className = 'form__status' + (kind ? ' is-' + kind : '');
    }

    function setBusy(busy) {
      button.disabled = busy;
      button.classList.toggle('is-busy', busy);
      if (label) { label.textContent = busy ? 'Sending…' : 'Send'; }
    }

    form.addEventListener('submit', function (event) {
      var allValid = fields.map(validate).every(Boolean);
      if (!allValid) {
        event.preventDefault();
        setStatus('Please check the highlighted fields.', 'error');
        var firstInvalid = fields.filter(function (f) { return f.getAttribute('aria-invalid') === 'true'; })[0];
        if (firstInvalid) { firstInvalid.focus(); }
        return;
      }

      event.preventDefault();
      setBusy(true);
      setStatus('');

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (response) { return response.json().catch(function () { return {}; }); })
        .then(function (data) {
          if (data && data.success) {
            form.reset();
            fields.forEach(function (field) {
              field.removeAttribute('aria-invalid');
              var message = errorFor(field);
              if (message) { message.hidden = true; }
            });
            setStatus('Thank you — your message is on its way. We will be in touch shortly.', 'success');
          } else {
            setStatus('Something went wrong. Please email info@elique-events.com instead.', 'error');
          }
        })
        .catch(function () {
          setStatus('Could not reach the server. Please email info@elique-events.com instead.', 'error');
        })
        .then(function () { setBusy(false); });
    });
  }

  /* ===========================================================================
     Scroll reveal
     ======================================================================== */
  function initReveal() {
    var targets = $$([
      '.section__title',
      '.section__lead',
      '.experience__tile',
      '.service-card',
      '.about__banner p',
      '.contact__intro',
      '.contact__form-wrap'
    ].join(','));

    if (!targets.length) { return; }

    if (!('IntersectionObserver' in window) || prefersReducedMotion.matches) { return; }

    // Elements already on screen when the script runs are left alone —
    // animating them in would show a flash of empty page first.
    var pending = targets.filter(function (element) {
      return element.getBoundingClientRect().top > window.innerHeight * 0.9;
    });
    if (!pending.length) { return; }

    pending.forEach(function (element, i) {
      element.setAttribute('data-reveal', '');
      // A small stagger keeps groups of cards from arriving all at once.
      element.style.transitionDelay = (i % 4) * 70 + 'ms';
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    pending.forEach(function (element) { observer.observe(element); });
  }

  /* ===========================================================================
     Back to top
     ======================================================================== */
  function initBackToTop() {
    var button = $('#to-top');
    if (!button) { return; }

    var ticking = false;
    function onScroll() {
      if (ticking) { return; }
      ticking = true;
      window.requestAnimationFrame(function () {
        var show = window.scrollY > window.innerHeight;
        button.hidden = !show;
        button.classList.toggle('is-visible', show);
        ticking = false;
      });
    }

    button.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion.matches ? 'auto' : 'smooth'
      });
      var firstLink = $('.site-header__logo');
      if (firstLink) { firstLink.focus({ preventScroll: true }); }
    });

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ===========================================================================
     Miscellaneous
     ======================================================================== */
  function initYear() {
    $$('[data-year]').forEach(function (element) {
      element.textContent = String(new Date().getFullYear());
    });
  }

  /* ===========================================================================
     Boot
     ======================================================================== */
  onReady(function () {
    initMobileNav();
    initHeader();
    initScrollSpy();
    initCarousel();
    initBackgroundVideos();
    initBackdrop();
    initContactForm();
    initReveal();
    initBackToTop();
    initYear();
  });
})();
