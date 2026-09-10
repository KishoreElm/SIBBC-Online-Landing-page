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
     1. Registration — native on-page form (#enrol)

     Every "Register" button jumps to #enrol. On submit the form:
       • posts to the existing Google Form, so responses still land
         in the same spreadsheet (action + entry.* IDs below);
       • fires the Meta Pixel "Lead" event — needs META_PIXEL_ID in
         index.html's <head>;
       • POSTs the same event (shared event_id, for deduplication)
         to CAPI_ENDPOINT for the server-side Conversions API event.
         Leave CAPI_ENDPOINT "" until that endpoint exists — see the
         README for the payload it receives and a sample handler.
     ----------------------------------------------------------- */
  var CAPI_ENDPOINT = "";

  var GFORM_ACTION = "https://docs.google.com/forms/d/e/1FAIpQLSfF11bzKehgrLVyu4QvvBxGjQDn4qD2D57ncfwTWbmPqixTOA/formResponse";
  var GFORM_ENTRY = {
    name:       "entry.1230168326",
    whatsapp:   "entry.310294248",
    email:      "entry.1121761539",
    education:  "entry.1328196783",
    place:      "entry.300486032",
    profession: "entry.1399620908",
    ministry:   "entry.2079524038",
    source:     "entry.1642796003"
  };
  var GFORM_FALLBACK = "https://forms.gle/biuxaGiAj6wjfLG29";

  // "Register" buttons: smooth-scroll to #enrol (Lenis handles the anchor),
  // then, on non-touch devices, put the cursor in the first field.
  var canHover = window.matchMedia("(hover: hover)").matches;
  document.querySelectorAll('[data-register], [data-countdown-cta]').forEach(function (el) {
    el.addEventListener("click", function () {
      if (!canHover) return;
      var first = document.getElementById("reg-name");
      if (first) window.setTimeout(function () {
        try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); }
      }, 700);
    });
  });

  (function registrationForm() {
    var form = document.getElementById("regform");
    if (!form) return;

    var doneEl    = document.getElementById("regform-done");
    var statusEl  = form.querySelector(".regform__status");
    var submitBtn = form.querySelector(".regform__submit");
    var sourceSel = form.querySelector("#reg-source");
    var otherWrap = form.querySelector("[data-source-other]");
    var otherInput = form.querySelector("#reg-source-other");
    var sending = false;

    form.setAttribute("novalidate", "");   // JS owns validation from here on

    var fieldOf = function (input) { return input.closest(".regfield"); };
    var boxOf = function (input) {
      var f = fieldOf(input);
      return (f && f.querySelector(".regfield__err")) ||
             document.getElementById(input.getAttribute("aria-describedby"));
    };
    var setError = function (input, msg) {
      var f = fieldOf(input), box = boxOf(input);
      if (f) f.classList.toggle("is-invalid", !!msg);
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      if (box) { box.textContent = msg || ""; box.hidden = !msg; }
    };

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var validate = function (input) {
      if (input.hidden || (fieldOf(input) && fieldOf(input).hidden)) return true;
      var val = (input.value || "").trim();
      var msg = "";
      if (input.type === "checkbox") {
        if (input.required && !input.checked) msg = "Please tick this box so we can contact you.";
      } else if (input.required && !val) {
        msg = "This field is required.";
      } else if (input.type === "email" && val && !EMAIL_RE.test(val)) {
        msg = "Enter a valid email address.";
      } else if (input.type === "tel" && val && val.replace(/\D/g, "").length < 8) {
        msg = "Enter a valid number, with country or area code.";
      }
      setError(input, msg);
      return !msg;
    };

    var fields = Array.prototype.slice.call(
      form.querySelectorAll("input[name], textarea[name], select[name]")
    );
    fields.forEach(function (input) {
      var evt = (input.tagName === "SELECT" || input.type === "checkbox") ? "change" : "blur";
      input.addEventListener(evt, function () { validate(input); });
      input.addEventListener("input", function () {
        var f = fieldOf(input);
        if (f && f.classList.contains("is-invalid")) validate(input);
      });
    });

    // "Other" free-text box appears only when "Other" is selected
    var syncOther = function () {
      var isOther = sourceSel.value === "Other";
      otherWrap.hidden = !isOther;
      otherInput.toggleAttribute("required", isOther);
      if (!isOther) { otherInput.value = ""; setError(otherInput, ""); }
    };
    if (sourceSel && otherWrap) {
      sourceSel.addEventListener("change", syncOther);
      syncOther();
    }

    // arrived from a Facebook click-through → pre-pick the source
    try {
      if (sourceSel && !sourceSel.value &&
          new URLSearchParams(location.search).get("fbclid")) {
        sourceSel.value = "Facebook";
      }
    } catch (e) {}

    var uuid = function () {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });
    };
    var cookie = function (name) {
      var m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
      return m ? m.pop() : "";
    };
    var fbc = function () {
      var c = cookie("_fbc");
      if (c) return c;
      var id = "";
      try { id = new URLSearchParams(location.search).get("fbclid") || ""; } catch (e) {}
      return id ? "fb.1." + Date.now() + "." + id : "";
    };

    var collect = function () {
      var g = function (n) { return form.elements[n] ? (form.elements[n].value || "").trim() : ""; };
      return {
        name: g("name"), whatsapp: g("whatsapp"), email: g("email"),
        education: g("education"), place: g("place"), profession: g("profession"),
        ministry: g("ministry"), source: g("source"), source_other: g("source_other")
      };
    };

    var postToGoogle = function (d) {
      var body = new URLSearchParams();
      body.append(GFORM_ENTRY.name, d.name);
      body.append(GFORM_ENTRY.whatsapp, d.whatsapp);
      body.append(GFORM_ENTRY.email, d.email);
      body.append(GFORM_ENTRY.education, d.education);
      body.append(GFORM_ENTRY.place, d.place);
      body.append(GFORM_ENTRY.profession, d.profession);
      body.append(GFORM_ENTRY.ministry, d.ministry);
      if (d.source === "Other") {
        body.append(GFORM_ENTRY.source, "__other_option__");
        body.append(GFORM_ENTRY.source + ".other_option_response", d.source_other);
      } else if (d.source) {
        body.append(GFORM_ENTRY.source, d.source);
      }
      body.append(GFORM_ENTRY.source + "_sentinel", "");
      body.append("fvv", "1");
      body.append("pageHistory", "0");
      body.append("submissionTimestamp", "-1");
      return fetch(GFORM_ACTION, { method: "POST", mode: "no-cors", body: body });
    };

    var fireLead = function (d, eventId) {
      if (window.fbq) {
        fbq("track", "Lead", {
          content_name: "Certificate in Advanced Christian Apologetics",
          content_category: "Course registration"
        }, { eventID: eventId });
      }
      if (CAPI_ENDPOINT) {
        try {
          fetch(CAPI_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            keepalive: true,
            body: JSON.stringify({
              event_name: "Lead",
              event_id: eventId,
              event_source_url: location.href,
              action_source: "website",
              fbp: cookie("_fbp") || null,
              fbc: fbc() || null,
              user_data: { email: d.email, phone: d.whatsapp, name: d.name },
              custom_data: {
                content_name: "Certificate in Advanced Christian Apologetics",
                lead_source: d.source || "Website"
              }
            })
          }).catch(function () {});
        } catch (e) {}
      }
    };

    var showDone = function () {
      form.hidden = true;
      doneEl.hidden = false;
      try { doneEl.focus(); } catch (e) {}
      doneEl.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sending) return;

      var firstBad = null;
      fields.forEach(function (input) {
        if (!validate(input) && !firstBad) firstBad = input;
      });
      if (firstBad) {
        statusEl.textContent = "Please check the highlighted fields above.";
        try { firstBad.focus(); } catch (x) {}
        return;
      }
      statusEl.textContent = "";

      var data = collect();
      var eventId = uuid();
      sending = true;
      form.classList.add("is-sending");
      submitBtn.disabled = true;

      postToGoogle(data).then(function () {
        fireLead(data, eventId);
        showDone();
      }).catch(function () {
        sending = false;
        form.classList.remove("is-sending");
        submitBtn.disabled = false;
        statusEl.innerHTML =
          "Something blocked the submission. Please try again — or " +
          '<a href="' + GFORM_FALLBACK + '" target="_blank" rel="noopener">use the Google&nbsp;Form</a>.';
      });
    });
  })();

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
    ".learn__meta, .pathway__foot, .closer__inner, .hero__carousel, .tstack, .tstack__nav"
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
     9. Testimonials — card stack
     A deck of overlapping cards; the front one flips to the back
     on next/prev, drag-flick, dot click, or a 7s auto-advance.
     Pauses on hover / focus / off-screen / hidden tab, and never
     auto-advances under prefers-reduced-motion.
     ----------------------------------------------------------- */
  (function () {
    var root = document.querySelector("[data-tstack]");
    if (!root) return;
    var wrap = root.querySelector("[data-tstack-cards]");
    var cards = Array.prototype.slice.call(wrap.querySelectorAll(".tcard"));
    var n = cards.length;
    if (!n) return;

    var nav = document.querySelector("[data-tstack-nav]");
    var prevBtn = nav && nav.querySelector("[data-tstack-prev]");
    var nextBtn = nav && nav.querySelector("[data-tstack-next]");
    var dotsWrap = nav && nav.querySelector("[data-tstack-dots]");
    var live = root.querySelector("[data-tstack-live]");
    var INTERVAL = 7000;
    var active = 0, dir = 1, timer = null;
    var playing = !reduceMotion && n > 1;

    if (nav && n < 2) nav.hidden = true;

    var dots = [];
    if (dotsWrap && n > 1) {
      cards.forEach(function (c, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "tstack__dot";
        b.setAttribute("role", "tab");
        b.setAttribute("aria-label", "Testimonial " + (i + 1));
        b.addEventListener("click", function () { go(i - active, true); });
        dotsWrap.appendChild(b);
        dots.push(b);
      });
    }

    var textOf = function (el, sel) {
      var t = el.querySelector(sel);
      return t ? t.textContent.replace(/\s+/g, " ").trim() : "";
    };

    var sizeStack = function () {
      if (root.clientWidth < 240) return;          // degenerate layout — leave the CSS fallback
      var h = 0;
      for (var i = 0; i < n; i++) h = Math.max(h, cards[i].scrollHeight);
      if (h >= 200 && h <= 640) root.style.minHeight = Math.ceil(h + 44) + "px";  // headroom for the peeking cards
    };

    var render = function () {
      cards.forEach(function (card, i) {
        var order = (i - active + n) % n, t, o, z;
        if (order === 0) {
          t = ""; o = "1"; z = n + 2;
          card.classList.add("tcard--front");
          card.setAttribute("aria-hidden", "false");
        } else {
          card.classList.remove("tcard--front");
          card.setAttribute("aria-hidden", "true");
          if (order === 1) { t = "translateY(26px) scale(0.955) rotate(-2.5deg)"; o = "0.7"; z = n; }
          else if (order === 2) { t = "translateY(50px) scale(0.912) rotate(3deg)"; o = "0.4"; z = n - 1; }
          else if (order === n - 1) {
            t = "translateX(" + (dir > 0 ? "-24%" : "24%") + ") translateY(30px) scale(0.92) rotate(" +
                (dir > 0 ? "-12deg" : "12deg") + ")";
            o = "0"; z = 1;
          } else { t = "translateY(66px) scale(0.87)"; o = "0"; z = 2; }
        }
        card.style.transform = t;
        card.style.opacity = o;
        card.style.zIndex = z;
      });
      dots.forEach(function (d, i) { d.setAttribute("aria-current", i === active ? "true" : "false"); });
      if (live) {
        live.textContent = "Testimonial " + (active + 1) + " of " + n + " — " +
          textOf(cards[active], ".tcard__name") + ", " + textOf(cards[active], ".tcard__role");
      }
    };

    function go(step, userAction) {
      if (n < 2 || !step) return;
      dir = step > 0 ? 1 : -1;
      active = ((active + step) % n + n) % n;
      render();
      if (userAction) restart();
    }
    function start() { if (playing) { stop(); timer = window.setInterval(function () { go(1); }, INTERVAL); } }
    function stop() { window.clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }

    if (prevBtn) prevBtn.addEventListener("click", function () { go(-1, true); });
    if (nextBtn) nextBtn.addEventListener("click", function () { go(1, true); });

    root.addEventListener("pointerenter", stop);
    root.addEventListener("pointerleave", restart);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", restart);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop(); else restart();
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) restart(); else stop(); });
      }, { threshold: 0.3 }).observe(root);
    }

    root.setAttribute("tabindex", "0");
    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1, true); }
      else if (e.key === "ArrowRight") { e.preventDefault(); go(1, true); }
    });

    // drag / flick the front card
    var startX = null, drag = null;
    root.addEventListener("pointerdown", function (e) {
      var front = cards[active];
      if (n < 2 || !front.contains(e.target)) return;
      startX = e.clientX;
      drag = front;
      front.classList.add("is-dragging");
      stop();
    });
    window.addEventListener("pointermove", function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      drag.style.transform = "translateX(" + dx + "px) rotate(" + (dx * 0.03).toFixed(2) + "deg)";
    });
    window.addEventListener("pointerup", function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      drag.classList.remove("is-dragging");
      drag = null; startX = null;
      if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1, true);
      else { render(); restart(); }
    });

    window.addEventListener("resize", sizeStack);
    window.addEventListener("load", sizeStack);

    render();
    sizeStack();
    window.setTimeout(sizeStack, 400);   // after webfonts settle
    start();
  })();

  /* -----------------------------------------------------------
     10. Footer year
     ----------------------------------------------------------- */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
