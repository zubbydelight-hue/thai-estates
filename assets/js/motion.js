/* Движение и появление: Lenis + GSAP ScrollTrigger + SplitType.
   Атрибуты:
   data-split          — заголовок, появление построчно
   data-reveal         — блок, fade+rise при входе в вьюпорт
   data-reveal-group   — контейнер, дети появляются каскадом
   data-parallax       — контейнер с img, лёгкий параллакс
   data-count          — число, счётчик от 0 (data-count="311", data-suffix="%")
   data-hero-img       — фон hero, медленный zoom-out при загрузке
*/

(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Прелоадер ---------- */
  function hidePreloader(cb) {
    const pre = document.querySelector(".preloader");
    if (!pre) { cb && cb(); return; }
    const logo = pre.querySelector(".preloader__logo");
    if (window.gsap && !reduce) {
      gsap.to(logo, { opacity: 1, duration: 0.5, ease: "power2.out" });
      gsap.timeline({ delay: 1.15 })
        .to(pre, { yPercent: -100, duration: 0.9, ease: "power4.inOut" })
        .set(pre, { display: "none" })
        .add(() => cb && cb(), "-=0.55");
    } else {
      pre.style.display = "none";
      cb && cb();
    }
  }

  /* ---------- Lenis ---------- */
  let lenis = null;
  function initLenis() {
    // Только десктоп с мышью: на тач-устройствах и узких экранах
    // нативный скролл надёжнее, а перехват wheel может блокировать прокрутку
    const desktopPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (window.Lenis && !reduce && desktopPointer && window.innerWidth > 900) {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      lenis.on("scroll", () => window.ScrollTrigger && ScrollTrigger.update());
      function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
    }

    // якорные ссылки: через lenis либо нативно
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length > 1 && document.querySelector(id)) {
          e.preventDefault();
          if (lenis) {
            lenis.scrollTo(id, { offset: -70, duration: 1.4 });
          } else {
            const top = document.querySelector(id).getBoundingClientRect().top + window.scrollY - 70;
            window.scrollTo({ top: top, behavior: "smooth" });
          }
        }
      });
    });
  }

  /* ---------- Reveal-анимации ---------- */
  function initReveals() {
    if (!window.gsap) {
      document.querySelectorAll("[data-reveal], [data-reveal-group] > *").forEach((el) => {
        el.style.opacity = 1; el.style.transform = "none";
      });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    // Элемент уже во вьюпорте при инициализации? Тогда анимируем сразу:
    // ScrollTrigger со start:0 без события скролла может так и не сработать
    const inViewNow = (el) => el.getBoundingClientRect().top < window.innerHeight * 0.9;

    // Построчные заголовки
    if (window.SplitType && !reduce) {
      document.querySelectorAll("[data-split]").forEach((el) => {
        const split = new SplitType(el, { types: "lines", lineClass: "line-inner" });
        split.lines.forEach((line) => {
          const mask = document.createElement("span");
          mask.className = "line-mask";
          line.parentNode.insertBefore(mask, line);
          mask.appendChild(line);
        });
        const lines = el.querySelectorAll(".line-inner");
        if (el.closest(".hero")) {
          // hero анимируется после прелоадера — просто прячем строки
          gsap.set(lines, { yPercent: 115 });
        } else {
          const cfg = {
            yPercent: 0,
            duration: 1.15,
            stagger: 0.09,
            ease: "power4.out"
          };
          if (inViewNow(el)) cfg.delay = 0.15;
          else cfg.scrollTrigger = { trigger: el, start: "clamp(top 88%)", once: true };
          gsap.fromTo(lines, { yPercent: 115 }, cfg);
        }
      });
    }

    // Обычные блоки
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      const cfg = {
        opacity: 1, y: 0, duration: 1.1, ease: "power3.out",
        delay: parseFloat(el.dataset.delay || 0)
      };
      if (inViewNow(el)) cfg.delay += 0.2;
      else cfg.scrollTrigger = { trigger: el, start: "clamp(top 90%)", once: true };
      gsap.fromTo(el, { opacity: 0, y: reduce ? 0 : 44 }, cfg);
    });

    // Каскады
    document.querySelectorAll("[data-reveal-group]").forEach((group) => {
      const cfg = {
        opacity: 1, y: 0, duration: 1, ease: "power3.out",
        stagger: parseFloat(group.dataset.stagger || 0.1)
      };
      if (inViewNow(group)) cfg.delay = 0.25;
      else cfg.scrollTrigger = { trigger: group, start: "clamp(top 88%)", once: true };
      gsap.fromTo(group.children, { opacity: 0, y: reduce ? 0 : 44 }, cfg);
    });

    // Параллакс изображений
    if (!reduce) {
      document.querySelectorAll("[data-parallax]").forEach((wrap) => {
        const img = wrap.querySelector("img");
        if (!img) return;
        gsap.fromTo(img, { yPercent: -8 }, {
          yPercent: 8,
          ease: "none",
          scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: 0.6 }
        });
      });
    }

    // Счётчики
    document.querySelectorAll("[data-count]").forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const prefix = el.dataset.prefix || "";
      const decimals = (el.dataset.count.split(".")[1] || "").length;
      const from = el.dataset.countFrom !== undefined ? parseFloat(el.dataset.countFrom) : 0;
      const obj = { v: from };
      const cfg = {
        v: target,
        duration: 1.8,
        ease: "power2.out",
        onUpdate() {
          el.textContent = prefix + obj.v.toFixed(decimals).replace(".", ",") + suffix;
        }
      };
      // всё, что видно на первом экране (включая самый низ), считаем сразу,
      // иначе пользователь открывает сайт и видит нули до первого скролла
      if (el.getBoundingClientRect().top < window.innerHeight) cfg.delay = 0.2;
      else cfg.scrollTrigger = { trigger: el, start: "clamp(top 97%)", once: true };
      gsap.to(obj, cfg);
    });

    // Hero-изображение: медленный zoom
    if (!reduce) {
      document.querySelectorAll("[data-hero-img] img").forEach((img) => {
        gsap.to(img, { scale: 1, duration: 2.6, ease: "power2.out", delay: 0.4 });
      });
    }

    // Пересчёт позиций триггеров после полной загрузки и подгрузки lazy-картинок,
    // иначе на мобильных нижние секции могут остаться скрытыми
    let refreshT = null;
    const queueRefresh = () => {
      clearTimeout(refreshT);
      refreshT = setTimeout(() => ScrollTrigger.refresh(), 200);
    };
    window.addEventListener("load", queueRefresh);
    document.querySelectorAll("img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", queueRefresh, { once: true });
    });

    initRevealFailsafe();
  }

  /* Страховка: если элемент попал во вьюпорт, но остался прозрачным
     (триггер не сработал по любой причине) — показываем принудительно */
  function initRevealFailsafe() {
    // hero исключаем: его элементы анимирует таймлайн после прелоадера
    let els = Array.prototype.slice.call(
      document.querySelectorAll("[data-reveal], [data-reveal-group] > *, [data-split] .line-inner")
    ).filter((el) => !el.closest(".hero"));
    let checkT = null;
    const stillHidden = (el) => {
      const cs = getComputedStyle(el);
      if (parseFloat(cs.opacity) < 0.05) return true;
      // строки заголовков прячутся сдвигом, а не прозрачностью
      const m = cs.transform.match(/matrix\([^)]*,\s*(-?[\d.]+)\)/);
      return !!(m && Math.abs(parseFloat(m[1])) > 12);
    };
    function check() {
      const vh = window.innerHeight;
      const now = Date.now();
      els = els.filter((el) => {
        const r = el.getBoundingClientRect();
        const inView = r.top < vh * 0.96 && r.bottom > -vh * 0.5;
        if (!inView) { el.__seenAt = 0; return true; }
        if (!stillHidden(el)) return false; // уже показан
        if (!el.__seenAt) { el.__seenAt = now; return true; }
        if (now - el.__seenAt > 600) {
          // триггер мёртв — показываем сами
          if (window.gsap) gsap.to(el, { opacity: 1, y: 0, yPercent: 0, duration: 0.8, ease: "power3.out" });
          else { el.style.opacity = 1; el.style.transform = "none"; }
          return false;
        }
        return true;
      });
    }
    window.addEventListener("scroll", () => {
      clearTimeout(checkT);
      checkT = setTimeout(check, 300);
    }, { passive: true });
    // Без скролла тоже проверяем: нужно два прохода, чтобы отличить
    // «анимация ещё идёт» от «триггер мёртв»
    [900, 1700, 2800, 4200].forEach((t) => setTimeout(check, t));
  }

  /* Аварийный показ всего скрытого — если инициализация анимаций упала */
  function revealEverything() {
    document.querySelectorAll("[data-reveal], [data-reveal-group] > *, [data-split] .line-inner").forEach((el) => {
      el.style.opacity = 1;
      el.style.transform = "none";
    });
  }

  /* ---------- Скрытие навигации при скролле вниз ---------- */
  function initNav() {
    const nav = document.querySelector(".nav");
    if (!nav) return;
    let last = 0;
    window.addEventListener("scroll", () => {
      if (document.body.classList.contains("menu-open")) return;
      const y = window.scrollY;
      nav.classList.toggle("is-scrolled", y > 60);
      if (y > 500 && y > last + 6) nav.classList.add("is-hidden");
      else if (y < last - 6) nav.classList.remove("is-hidden");
      last = y;
    }, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    try { initLenis(); } catch (e) { /* нативный скролл */ }
    initNav();
    hidePreloader(() => {
      // hero-анимации стартуют после прелоадера
      const hero = document.querySelector(".hero");
      if (hero && window.gsap && !reduce) {
        const tl = gsap.timeline();
        const label = hero.querySelector(".label");
        const lines = hero.querySelectorAll("[data-split] .line-inner");
        const rest = hero.querySelectorAll("[data-hero-fade]");
        if (label) tl.fromTo(label, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0.05);
        if (lines.length) tl.fromTo(lines, { yPercent: 115 }, { yPercent: 0, duration: 1.25, stagger: 0.1, ease: "power4.out" }, 0.12);
        if (rest.length) tl.fromTo(rest, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.95, stagger: 0.12, ease: "power3.out" }, 0.55);
      }
    });
    try {
      initReveals();
    } catch (e) {
      revealEverything();
    }
  });

  window.__refreshReveals = initReveals;
})();
