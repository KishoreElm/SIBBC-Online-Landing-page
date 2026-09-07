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
     Paste the URL of your registration form (Fillout, Google Form,
     Zoho, etc.). Every "Register" / "Open the registration form"
     button on the page will point to it and open in a new tab.
     Until you set it, those buttons fall back to WhatsApp.
     ----------------------------------------------------------- */
  var REGISTER_URL = ""; // e.g. "https://forms.gle/xxxxxxxx"

  var registerHref = REGISTER_URL || "https://wa.me/916380873580";
  document.querySelectorAll("[data-register]").forEach(function (el) {
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
      if (window.innerWidth > 880) closeMenu();
    });
  }

  /* -----------------------------------------------------------
     4. Scroll reveal — tag section blocks, observe once
     ----------------------------------------------------------- */
  var revealTargets = document.querySelectorAll(
    ".section__title, .section__intro, .card, .learn__item, " +
    ".outcomes li, .fac, .spec, .factstrip, .stage, " +
    ".learn__meta, .pathway__foot, .closer__inner, .hero__banner, .countdown__inner"
  );
  revealTargets.forEach(function (el) { el.setAttribute("data-reveal", ""); });

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
     7. Footer year
     ----------------------------------------------------------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
