/* Каталог: рендер карточек, фильтры, встроенный квиз */

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("cards-grid");
  const count = document.getElementById("catalog-count");
  const moreWrap = document.getElementById("cards-more");
  const moreBtn = document.getElementById("cards-more-btn");
  const COLLAPSED_COUNT = 3;
  let firstRender = true;

  // все 18 проектов подборки
  const CATALOG = PROJECTS;

  // Карточка: только название, стоимость, площадь и теги; клик открывает попап
  function cardHtml(p) {
    const perks = (p.perks || [])
      .map((t) => '<span class="pcard__perk">' + t + "</span>")
      .join("");
    return (
      '<article class="pcard" data-project="' + p.id + '">' +
      '<div class="pcard__media">' +
      '<div class="pcard__tags">' +
      '<span class="pcard__tag">' + p.strategyLabel + "</span>" +
      '<span class="pcard__tag">' + (p.type === "villa" ? "Виллы" : "Апартаменты") + "</span>" +
      "</div>" +
      '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy">' +
      '<span class="pcard__go">→</span>' +
      "</div>" +
      '<div class="pcard__body">' +
      '<h3 class="pcard__name">' + p.name + "</h3>" +
      '<div class="pcard__specs">' +
      '<div class="pcard__spec"><small>Стоимость</small><b>' + p.priceLabel + "</b></div>" +
      '<div class="pcard__spec"><small>Площадь</small><b>' + (p.areaLabel || "—") + "</b></div>" +
      "</div>" +
      (perks ? '<div class="pcard__perks">' + perks + "</div>" : "") +
      "</div></article>"
    );
  }

  // Слайдер проектов в показательном блоке «Личный эксперт»
  const scTrack = document.getElementById("showcase-slider");
  if (scTrack) {
    scTrack.innerHTML = CATALOG.slice(0, 8)
      .map((p) =>
        '<div class="sc-slide"><img src="' + p.img + '" alt="' + p.name + '" loading="lazy">' +
        '<div class="sc-slide__body"><div class="sc-slide__name">' + p.name + "</div>" +
        '<div class="sc-slide__price">' + p.priceLabel + "</div></div></div>"
      )
      .join("");
    document.querySelectorAll(".sc-slider__btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        const first = scTrack.querySelector(".sc-slide");
        const step = first ? first.getBoundingClientRect().width + 12 : 300;
        scTrack.scrollBy({ left: Number(btn.dataset.dir) * step, behavior: "smooth" });
      })
    );
  }

  function render(list) {
    const cardsHtml = list.map(cardHtml);
    grid.innerHTML = cardsHtml.join("");
    count.textContent = "Показано проектов: " + list.length + " из " + CATALOG.length;

    // изначально показываем только первые 3 проекта, остальное — по кнопке
    if (list.length > COLLAPSED_COUNT) {
      grid.classList.add("is-collapsed");
      if (moreWrap) moreWrap.hidden = false;
    } else {
      grid.classList.remove("is-collapsed");
      if (moreWrap) moreWrap.hidden = true;
    }

    if (window.gsap) {
      const cards = grid.querySelectorAll(".pcard");
      if (firstRender && window.ScrollTrigger) {
        gsap.set(cards, { opacity: 0, y: 46 });
        ScrollTrigger.batch(cards, {
          start: "top 92%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { opacity: 1, y: 0, duration: 0.95, stagger: 0.09, ease: "power3.out" })
        });
      } else {
        gsap.fromTo(cards, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "power3.out" });
      }
    }
    firstRender = false;
  }

  render(CATALOG);

  if (moreBtn) {
    moreBtn.addEventListener("click", () => {
      grid.classList.remove("is-collapsed");
      if (moreWrap) moreWrap.hidden = true;
      if (window.gsap) {
        gsap.to(grid.querySelectorAll(".pcard"), { opacity: 1, y: 0, duration: 0.6, stagger: 0.04, ease: "power3.out" });
      }
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  }

  // Строка-поиск: кастомные выпадающие списки
  const fields = document.querySelectorAll("#searchbar .sfield");
  fields.forEach((field) => {
    const valueEl = field.querySelector(".sfield__value");
    const menu = field.querySelector(".sfield__menu");
    field.addEventListener("click", (e) => {
      const li = e.target.closest("li[data-val]");
      if (li) {
        field.dataset.value = li.dataset.val;
        valueEl.textContent = li.textContent;
        menu.querySelectorAll("li").forEach((x) => x.classList.toggle("is-selected", x === li));
        field.classList.remove("is-open");
        return;
      }
      const willOpen = !field.classList.contains("is-open");
      fields.forEach((f) => f.classList.remove("is-open"));
      field.classList.toggle("is-open", willOpen);
    });
  });
  // закрытие меню кликом вне поля
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#searchbar .sfield")) fields.forEach((f) => f.classList.remove("is-open"));
  });

  // фильтр применяется ТОЛЬКО по кнопке; списки комбинируются по И
  function applyFilters() {
    let list = CATALOG.slice();
    fields.forEach((field) => {
      const kind = field.dataset.filter;
      const val = field.dataset.value;
      if (!val || val === "all") return;
      if (kind === "type") list = list.filter((p) => p.type === val);
      else if (kind === "region") list = list.filter((p) => p.region === val);
      else if (kind === "strategy") list = list.filter((p) => p.strategy.includes(val));
      else if (kind === "budget") {
        const [min, max] = val.split("-").map(Number);
        list = list.filter((p) => p.priceUsd >= min && (max ? p.priceUsd <= max : true));
      }
    });
    render(list);
  }
  const searchBtn = document.getElementById("search-submit");
  if (searchBtn) searchBtn.addEventListener("click", applyFilters);

  /* ---------- Попап проекта: галерея + подробности ---------- */
  const pm = document.getElementById("project-modal");
  if (pm) {
    const mainImg = pm.querySelector(".pmodal__main img");
    const counter = pm.querySelector(".pmodal__counter");
    const thumbs = pm.querySelector(".pmodal__thumbs");
    const info = pm.querySelector(".pmodal__info");
    let photos = [];
    let idx = 0;

    const show = (i) => {
      idx = (i + photos.length) % photos.length;
      mainImg.src = photos[idx];
      counter.textContent = (idx + 1) + " / " + photos.length;
      thumbs.querySelectorAll(".pmodal__thumb").forEach((t, n) => t.classList.toggle("is-active", n === idx));
    };

    const openProject = (p) => {
      photos = (p.photos && p.photos.length ? p.photos : [p.img]);
      thumbs.innerHTML = photos
        .map((src, n) => '<button class="pmodal__thumb" data-i="' + n + '"><img src="' + src + '" alt=""></button>')
        .join("");
      mainImg.alt = p.name;

      const tags = [p.strategyLabel, p.type === "villa" ? "Виллы" : "Апартаменты"]
        .map((t) => "<span>" + t + "</span>").join("");
      const fact = (label, val) =>
        val ? '<div class="pmodal__fact"><small>' + label + "</small><b>" + val + "</b></div>" : "";
      info.innerHTML =
        '<div class="pmodal__loc">' + p.location + "</div>" +
        '<div class="pmodal__name">' + p.name + "</div>" +
        '<div class="pmodal__tags">' + tags + "</div>" +
        '<div class="pmodal__specs">' +
        "<div><small>Стоимость</small><b>" + p.priceLabel + "</b></div>" +
        "<div><small>Площадь</small><b>" + (p.areaLabel || "—") + "</b></div>" +
        "</div>" +
        '<p class="pmodal__desc">' + p.desc + "</p>" +
        '<div class="pmodal__facts">' +
        fact("До моря", p.sea) +
        fact("Доходность", p.yieldLabel) +
        fact("Скидки", p.discount) +
        fact("Оплата", p.payment) +
        fact("Планировки", p.plans) +
        "</div>" +
        '<div class="pmodal__cta">' +
        '<button class="btn btn--gold btn--block" data-open-modal="Проект — ' + p.name + '">Получить цены и планировки <span class="arr">→</span></button>' +
        '<a class="btn btn--line-dark btn--block" href="#quiz" data-close-project>Подобрать похожие проекты</a>' +
        "</div>";

      show(0);
      pm.classList.add("is-open");
      // блокируем и html, и body: на мобильных overflow одного body не
      // останавливает прокрутку страницы под попапом
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    };

    const closeProject = () => {
      pm.classList.remove("is-open");
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };

    // клик по карточке (кроме тизера квиза)
    grid.addEventListener("click", (e) => {
      const card = e.target.closest(".pcard[data-project]");
      if (!card) return;
      const p = CATALOG.find((x) => x.id === card.dataset.project);
      if (p) openProject(p);
    });

    pm.querySelector(".pmodal__arrow--prev").addEventListener("click", () => show(idx - 1));
    pm.querySelector(".pmodal__arrow--next").addEventListener("click", () => show(idx + 1));
    thumbs.addEventListener("click", (e) => {
      const t = e.target.closest(".pmodal__thumb");
      if (t) show(+t.dataset.i);
    });
    pm.querySelector(".modal__backdrop").addEventListener("click", closeProject);
    pm.querySelector(".modal__close").addEventListener("click", closeProject);
    document.addEventListener("keydown", (e) => {
      if (!pm.classList.contains("is-open")) return;
      if (e.key === "Escape") closeProject();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
    // CTA внутри попапа: закрываем попап проекта (лид-модалку откроет common.js),
    // якорь «подобрать похожие» просто закрывает попап
    info.addEventListener("click", (e) => {
      if (e.target.closest("[data-open-modal]") || e.target.closest("[data-close-project]")) closeProject();
    });
  }

  /* ---------- Телефон в лид-попапе: код страны с флагом + маска ---------- */
  const CC = [
    ["ru", "Россия", "+7"], ["kz", "Казахстан", "+7"], ["by", "Беларусь", "+375"], ["ua", "Украина", "+380"],
    ["uz", "Узбекистан", "+998"], ["kg", "Кыргызстан", "+996"], ["az", "Азербайджан", "+994"], ["am", "Армения", "+374"],
    ["ge", "Грузия", "+995"], ["th", "Таиланд", "+66"], ["ae", "ОАЭ", "+971"], ["tr", "Турция", "+90"],
    ["il", "Израиль", "+972"], ["de", "Германия", "+49"], ["gb", "Великобритания", "+44"], ["us", "США", "+1"]
  ];
  // страна по умолчанию — из региона браузера, флаг живёт прямо в поле
  const region = ((navigator.language || "ru-RU").split("-")[1] || "ru").toLowerCase();
  const defCountry = CC.find((c) => c[0] === region) || CC[0];
  const flagUrl = (iso) => "https://flagcdn.com/w40/" + iso + ".png";

  const fmtNat = (d) => {
    let out = d.slice(0, 3);
    if (d.length > 3) out += " " + d.slice(3, 6);
    if (d.length > 6) out += "-" + d.slice(6, 8);
    if (d.length > 8) out += "-" + d.slice(8, 12);
    return out;
  };

  const enhancePhone = (input) => {
    if (!input || input.closest(".phone-field")) return;
    const wrap = document.createElement("span");
    wrap.className = "phone-field";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    const img = document.createElement("img");
    img.src = flagUrl(defCountry[0]);
    img.alt = defCountry[1];
    wrap.appendChild(img);
    input.placeholder = defCountry[2] + " 900 000-00-00";

    input.addEventListener("focus", () => {
      if (!input.value.trim()) input.value = defCountry[2] + " ";
    });
    input.addEventListener("blur", () => {
      if (input.value.trim() === defCountry[2] || input.value.trim() === "+") input.value = "";
    });
    input.addEventListener("input", () => {
      let raw = input.value.replace(/[^\d+]/g, "");
      if (!raw) { input.value = ""; return; }
      if (!raw.startsWith("+")) raw = defCountry[2] + raw; // авто-подстановка кода региона
      let best = null;
      CC.forEach((c) => {
        if (raw.startsWith(c[2]) && (!best || c[2].length > best[2].length)) best = c;
      });
      if (!best) { input.value = raw.slice(0, 5); return; } // код ещё набирается
      img.src = flagUrl(best[0]);
      img.alt = best[1];
      const nat = raw.slice(best[2].length).replace(/\D/g, "").slice(0, 12);
      // без хвостового пробела, иначе backspace не сможет стереть код
      input.value = best[2] + (nat ? " " + fmtNat(nat) : "");
    });
  };
  document.querySelectorAll('form input[type="tel"]').forEach(enhancePhone);
  // для динамических форм (результат квиза)
  window.enhancePhone = enhancePhone;

  // Плавающая кнопка квиза: появляется после hero, прячется у самого квиза
  const fab = document.querySelector(".quiz-fab");
  const quizSec = document.getElementById("quiz");
  if (fab && quizSec) {
    window.addEventListener("scroll", () => {
      const past = window.scrollY > window.innerHeight * 0.8;
      const r = quizSec.getBoundingClientRect();
      const nearQuiz = r.top < window.innerHeight && r.bottom > 0;
      fab.classList.toggle("is-visible", past && !nearQuiz);
    }, { passive: true });
  }

  // Встроенный квиз
  createQuiz(document.getElementById("quiz-container"), {
    resultImg: "assets/img/trisara-1.jpg",
    bullets: ["4 вопроса", "Меньше минуты", "Топ-3 проекта с ценами", { text: "PDF-подборка в подарок", img: "assets/img/catalog-cover.png" }],
    questions: [
      {
        key: "strategy",
        question: "Какая у вас цель?",
        hint: "От этого зависит стратегия и тип проекта",
        img: "assets/img/santa-monica-7.jpg",
        options: [
          { value: "rent", label: "Пассивный доход с аренды", sub: "до 10% годовых", img: "assets/img/santa-monica-5.jpg" },
          { value: "resale", label: "Заработать на росте цены", sub: "вход на стройке, выход на сдаче", img: "assets/img/riviera-malibu-2.jpg" },
          { value: "live", label: "Жильё для себя и семьи", sub: "переезд или зимовки", img: "assets/img/angsana-1.webp" },
          { value: "private", label: "Приватная коллекция", sub: "виллы от $1.5M", img: "assets/img/amanpuri-1.webp" }
        ]
      },
      {
        key: "region",
        question: "Какой регион вам ближе?",
        img: "assets/img/trisara-3.jpg",
        options: [
          { value: "phuket", label: "Пхукет", sub: "остров, премиум-курорты", img: "assets/img/trisara-2.jpg" },
          { value: "pattaya", label: "Паттайя", sub: "город у моря, низкий порог входа", img: "assets/img/riviera-malibu-3.jpg" },
          { value: "any", label: "Рассмотрю оба варианта", sub: "покажем лучшее из двух регионов", img: "assets/img/btgr-beach-2.webp" }
        ]
      },
      {
        key: "type",
        question: "Апартаменты или вилла?",
        img: "assets/img/botanica-grand-1.jpg",
        options: [
          { value: "condo", label: "Апартаменты", sub: "проще сдавать, ниже вход", img: "assets/img/cassia-1.webp" },
          { value: "villa", label: "Вилла", sub: "приватность и территория", img: "assets/img/hythe-1.jpg" },
          { value: "any", label: "Не принципиально", sub: "подберём по бюджету и цели", img: "assets/img/skypark-elara-1.webp" }
        ]
      },
      {
        key: "budget",
        question: "Какой бюджет рассматриваете?",
        img: "assets/img/santa-monica-3.jpg",
        options: [
          { value: "0-250000", label: "До $250 000", icon: "01" },
          { value: "250000-500000", label: "$250 000 – $500 000", icon: "02" },
          { value: "500000-2000000", label: "$500 000 – $2 000 000", icon: "03" },
          { value: "2000000-", label: "Более $2 000 000", icon: "04" }
        ]
      }
    ],
    renderResult(answers) {
      const top = matchProjects(answers, 3, CATALOG); // без проектов Паттайи
      return (
        '<div class="quiz__result-badge">Подборка готова</div>' +
        '<div class="quiz__question">Вам подходят эти проекты</div>' +
        '<p class="quiz__hint">Оставьте контакты — пришлём полную подборку с ценами, планировками и расчётом доходности по каждому проекту</p>' +
        miniCardsHtml(top) +
        leadFormHtml("Получить подборку с ценами")
      );
    }
  });
});
