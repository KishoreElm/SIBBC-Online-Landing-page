/* =============================================================
   Certificate in Advanced Christian Apologetics — interactions
   ============================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -----------------------------------------------------------
     0. Smooth scrolling (Lenis)
     Loaded from assets/vendor/lenis/. Disabled when the visitor
     asks for reduced motion, or if the script failed to load.
     ----------------------------------------------------------- */
  if (window.Lenis && !reduceMotion) {
    window.lenis = new Lenis({
      duration: 1.05,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      anchors: true,   // smooth #anchor jumps; header offset via scroll-padding-top
      autoRaf: true
    });
  }

  /* -----------------------------------------------------------
     1. Registration link  —  EDIT THIS ONE LINE
     The registration form URL. Every "Register" / "Open the
     registration form" button on the page points here and opens
     in a new tab. (It is also hard-coded on the links in
     index.html so they still work with JavaScript disabled —
     keep the two in sync.)
     ----------------------------------------------------------- */
  var REGISTER_URL = "https://forms.gle/biuxaGiAj6wjfLG29";

  var registerHref = REGISTER_URL || "https://wa.me/916380873580";
  document.querySelectorAll("[data-register], [data-countdown-cta]").forEach(function (el) {
    el.setAttribute("href", registerHref);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });

  /* -----------------------------------------------------------
     2. Sticky nav — shadow after scrolling past the hero top
     ----------------------------------------------------------- */
  var nav = document.querySelector("[data-nav]");
  var onScroll = function () {
    if (!nav) return;
    nav.classList.toggle("is-stuck", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* -----------------------------------------------------------
     3. Mobile menu
     ----------------------------------------------------------- */
  var toggle = document.querySelector("[data-menu-toggle]");
  var menu = document.querySelector("[data-mobile-menu]");

  function closeMenu() {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", "false");
    menu.removeAttribute("data-open");
    menu.hidden = true;
  }
  function openMenu() {
    if (!toggle || !menu) return;
    toggle.setAttribute("aria-expanded", "true");
    menu.hidden = false;
    menu.setAttribute("data-open", "");
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      open ? closeMenu() : openMenu();
    });
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  /* -----------------------------------------------------------
     4. Scroll reveal — tag section blocks, observe once
     ----------------------------------------------------------- */
  document.querySelectorAll(
    ".eyebrow, .section__title, .section__intro, .card, .learn__item, " +
    ".outcomes li, .fac, .spec, .stage, .program__figure, .pathway__figure, .learn__figure, " +
    ".learn__meta, .pathway__foot, .closer__inner, .hero__carousel"
  ).forEach(function (el) { el.setAttribute("data-reveal", ""); });

  // staggered groups — visible direct children reveal one after another
  document.querySelectorAll("[data-stagger]").forEach(function (group) {
    var i = 0;
    Array.prototype.forEach.call(group.children, function (kid) {
      if (kid.hidden ||
          kid.classList.contains("visually-hidden") ||
          getComputedStyle(kid).display === "none") return;
      kid.style.setProperty("--reveal-delay", (i++ * 65) + "ms");
      kid.setAttribute("data-reveal", "");
    });
  });

  var revealTargets = document.querySelectorAll("[data-reveal]");

  function revealNow(el) { el.classList.add("is-visible"); }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach(revealNow);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          revealNow(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });

    revealTargets.forEach(function (el) { io.observe(el); });

    // Safety net: anything already scrolled past / near the viewport on load
    // (fast scroll, restored scroll position, tall screens) reveals immediately.
    var sweep = function () {
      revealTargets.forEach(function (el) {
        if (el.classList.contains("is-visible")) return;
        if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
          revealNow(el);
          io.unobserve(el);
        }
      });
    };
    sweep();
    window.addEventListener("load", sweep);
    setTimeout(sweep, 1200);
  }

  /* -----------------------------------------------------------
     5. Pathway spine — draw the connecting line when in view
     ----------------------------------------------------------- */
  var spine = document.querySelector("[data-spine]");
  if (spine) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      spine.classList.add("is-visible");
    } else {
      var spineIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            spineIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      spineIO.observe(spine);
    }
  }

  /* -----------------------------------------------------------
     5b. Parallax — elements with [data-parallax="<px range>"] drift
     as they pass through the viewport. Driven off the Lenis scroll
     loop so it stays in sync with the smooth scrolling.
     ----------------------------------------------------------- */
  var parallaxEls = document.querySelectorAll("[data-parallax]");
  if (parallaxEls.length && !reduceMotion) {
    var ticking = false;
    var runParallax = function () {
      var vh = window.innerHeight;
      parallaxEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;   // skip off-screen
        var mid = r.top + r.height / 2;
        var progress = (mid - vh / 2) / (vh / 2 + r.height / 2); // ~ -1 .. 1
        progress = Math.max(-1.2, Math.min(1.2, progress));      // clamp the tails
        var range = parseFloat(el.getAttribute("data-parallax")) || 24;
        el.style.setProperty("--py", (progress * range).toFixed(1) + "px");
      });
      ticking = false;
    };
    var queueParallax = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(runParallax);
    };
    runParallax();
    if (window.lenis) window.lenis.on("scroll", queueParallax);
    else window.addEventListener("scroll", queueParallax, { passive: true });
    window.addEventListener("resize", queueParallax);
  }

  /* -----------------------------------------------------------
     6. Countdown to the first class — split-flap flip clock
     Target date/time is the data-countdown attr on the section
     (ISO 8601 with the IST offset +05:30).
     ----------------------------------------------------------- */
  var cd = document.querySelector("[data-countdown]");
  if (cd) {
    var target = new Date(cd.getAttribute("data-countdown")).getTime();
    var units = {
      d: cd.querySelector("[data-cd-days]"),
      h: cd.querySelector("[data-cd-hours]"),
      m: cd.querySelector("[data-cd-mins]"),
      s: cd.querySelector("[data-cd-secs]")
    };
    var doneMsg = cd.querySelector("[data-countdown-done]");
    var cta = cd.querySelector("[data-countdown-cta]");
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var timer, first = true;

    var leaf = function (flip, which) {
      return flip.querySelector(".flip__leaf--" + which + " span");
    };
    var setAll = function (flip, val) {
      leaf(flip, "top").textContent = val;
      leaf(flip, "bottom").textContent = val;
      leaf(flip, "fold-top").textContent = val;
      leaf(flip, "fold-bottom").textContent = val;
    };
    // settle a leftover flip from the previous tick (also self-heals if a
    // background tab throttled the animation)
    var settle = function (flip) {
      if (flip.classList.contains("is-flipping")) {
        flip.classList.remove("is-flipping");
        setAll(flip, leaf(flip, "top").textContent);
      }
    };
    var flipTo = function (flip, val) {
      var cur = leaf(flip, "top").textContent;
      if (cur === val) return;
      if (first || reduceMotion) { setAll(flip, val); return; }

      leaf(flip, "fold-top").textContent = cur;     // old — folds away
      leaf(flip, "bottom").textContent = cur;       // old — held behind the fold
      leaf(flip, "top").textContent = val;          // new — revealed as the fold lifts
      leaf(flip, "fold-bottom").textContent = val;  // new — folds down into place

      void flip.offsetWidth;                        // restart the CSS animation
      flip.classList.add("is-flipping");
    };

    var render = function () {
      if (isNaN(target)) { clearInterval(timer); return; }
      var diff = target - Date.now();
      if (diff <= 0) {
        clearInterval(timer);
        cd.classList.add("is-done");
        if (doneMsg) doneMsg.hidden = false;
        if (cta) cta.textContent = "Register for the next intake";
        return;
      }
      var secs = Math.floor(diff / 1000);
      var next = {
        d: pad(Math.floor(secs / 86400)),
        h: pad(Math.floor((secs % 86400) / 3600)),
        m: pad(Math.floor((secs % 3600) / 60)),
        s: pad(secs % 60)
      };
      Object.keys(units).forEach(function (k) { settle(units[k]); });
      flipTo(units.d, next.d);
      flipTo(units.h, next.h);
      flipTo(units.m, next.m);
      flipTo(units.s, next.s);
      first = false;
    };

    render();
    timer = setInterval(render, 1000);
  }

  /* -----------------------------------------------------------
     7. Hero banner carousel
     Slides live in [data-carousel-track]; a slide whose <img>
     fails to load removes itself, so the carousel adapts to
     however many banner-*.jpg files actually exist.
     ----------------------------------------------------------- */
  document.querySelectorAll("[data-carousel]").forEach(function (root) {
    var track = root.querySelector("[data-carousel-track]");
    var dotsWrap = root.querySelector("[data-carousel-dots]");
    var prevBtn = root.querySelector("[data-carousel-prev]");
    var nextBtn = root.querySelector("[data-carousel-next]");
    var toggleBtn = root.querySelector("[data-carousel-toggle]");
    var INTERVAL = 6000;
    var index = 0;
    var timer = null;
    var playing = !reduceMotion;

    var slides = function () {
      return Array.prototype.slice.call(track.querySelectorAll(".hero__carousel__slide"));
    };

    var build = function () {
      var list = slides();

      // single (or zero) usable slide → static banner, no controls
      if (list.length < 2) {
        stop();
        index = 0;
        track.style.transform = "translateX(0)";
        root.setAttribute("data-single", "");
        dotsWrap.textContent = "";
        list.forEach(function (s) { s.removeAttribute("aria-hidden"); });
        return;
      }
      root.removeAttribute("data-single");

      dotsWrap.textContent = "";
      list.forEach(function (slide, i) {
        slide.setAttribute("role", "group");
        slide.setAttribute("aria-roledescription", "slide");
        slide.setAttribute("aria-label", (i + 1) + " of " + list.length);

        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "hero__carousel__dot";
        dot.setAttribute("aria-label", "Show banner " + (i + 1));
        dot.addEventListener("click", function () { go(i, true); });
        dotsWrap.appendChild(dot);
      });

      if (index >= list.length) index = 0;
      render();
      if (playing) start();
    };

    var render = function () {
      var list = slides();
      track.style.transform = "translateX(" + (-index * 100) + "%)";
      list.forEach(function (s, i) { s.setAttribute("aria-hidden", i === index ? "false" : "true"); });
      Array.prototype.forEach.call(dotsWrap.children, function (d, i) {
        d.setAttribute("aria-current", i === index ? "true" : "false");
      });
    };

    var go = function (i, userAction) {
      var n = slides().length;
      if (!n) return;
      index = ((i % n) + n) % n;
      render();
      if (userAction && playing) start();   // reset the timer after a manual move
    };

    var start = function () {
      if (reduceMotion) return;
      stop();
      timer = window.setInterval(function () { go(index + 1); }, INTERVAL);
    };
    var stop = function () { window.clearInterval(timer); timer = null; };

    var setPlaying = function (state) {
      playing = state;
      if (toggleBtn) {
        toggleBtn.setAttribute("aria-pressed", state ? "false" : "true");
        toggleBtn.setAttribute("aria-label", state ? "Pause banner rotation" : "Resume banner rotation");
      }
      state ? start() : stop();
    };

    if (prevBtn) prevBtn.addEventListener("click", function () { go(index - 1, true); });
    if (nextBtn) nextBtn.addEventListener("click", function () { go(index + 1, true); });
    if (toggleBtn) toggleBtn.addEventListener("click", function () { setPlaying(!playing); });

    // pause while hovered / focused, resume after
    root.addEventListener("pointerenter", stop);
    root.addEventListener("pointerleave", function () { if (playing) start(); });
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", function () { if (playing) start(); });

    // pause when the tab is hidden or the carousel is scrolled out of view
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else if (playing) start();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && playing) start(); else stop();
        });
      }, { threshold: 0.25 }).observe(root);
    }

    // arrow keys when the carousel has focus
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { go(index - 1, true); }
      else if (e.key === "ArrowRight") { go(index + 1, true); }
    });

    // touch / mouse swipe
    var down = null;
    track.addEventListener("pointerdown", function (e) { down = e.clientX; });
    window.addEventListener("pointerup", function (e) {
      if (down === null) return;
      var dx = e.clientX - down;
      if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1), true);
      down = null;
    });

    // if a slide removes itself after load, rebuild
    track.addEventListener("error", function () { window.setTimeout(build, 0); }, true);

    build();
    if (reduceMotion && toggleBtn) toggleBtn.hidden = true;
  });

  /* -----------------------------------------------------------
     8. "How it works" illustration — graceful fallback
     If the image in the markup is missing, look for
     assets/img/learning/illustration.{svg,png,jpg,jpeg,webp}
     and use the first that loads. (No requests unless it fails.)
     ----------------------------------------------------------- */
  (function () {
    var img = document.querySelector("[data-learn-illustration]");
    if (!img) return;
    function findFallback() {
      var exts = ["svg", "png", "jpg", "jpeg", "webp"], i = 0;
      (function probe() {
        if (i >= exts.length) return;
        var url = "assets/img/learning/illustration." + exts[i++];
        var test = new Image();
        test.onload = function () { img.src = url; };
        test.onerror = probe;
        test.src = url;
      })();
    }
    if (img.complete && img.naturalWidth === 0) findFallback();
    else img.addEventListener("error", findFallback);
  })();

  /* -----------------------------------------------------------
     9. Footer year
     ----------------------------------------------------------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
