/* Каталог: рендер карточек, фильтры, модалка проекта, встроенный квиз */

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("cards-grid");
  const count = document.getElementById("catalog-count");
  let firstRender = true;

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
      "</div>" +
      '<div class="pcard__body">' +
      '<div class="pcard__loc">' + p.location + "</div>" +
      '<h3 class="pcard__name">' + p.name + "</h3>" +
      '<div class="pcard__specs">' +
      '<div class="pcard__spec"><small>Стоимость</small><b>' + p.priceLabel + "</b></div>" +
      '<div class="pcard__spec"><small>Площадь</small><b>' + (p.areaLabel || "—") + "</b></div>" +
      "</div>" +
      (perks ? '<div class="pcard__perks">' + perks + "</div>" : "") +
      '<div class="pcard__foot"><button class="pcard__btn" type="button">Подробнее о проекте <span>→</span></button></div>' +
      "</div></article>"
    );
  }

  // Компактная врезка-CTA внутри сетки лотов (открывает лид-попап)
  const quizTeaserHtml =
    '<div class="pcard pcard--teaser">' +
    '<div class="pcard-teaser__inner">' +
    '<span class="pcard-teaser__label">Нужна помощь?</span>' +
    '<div class="pcard-teaser__title">Не можете выбрать из 18 проектов?</div>' +
    '<p class="pcard-teaser__note">Оставьте заявку — поможем с выбором</p>' +
    '<button class="btn btn--gold" data-open-modal="Врезка в каталоге">Получить подборку <span class="arr">→</span></button>' +
    "</div></div>";

  function render(list) {
    const cardsHtml = list.map(cardHtml);
    if (cardsHtml.length > 6) cardsHtml.splice(6, 0, quizTeaserHtml);
    else cardsHtml.push(quizTeaserHtml);
    grid.innerHTML = cardsHtml.join("");
    count.textContent = "Показано проектов: " + list.length + " из " + PROJECTS.length;

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

  render(PROJECTS);

  /* ---------- Фильтры: регион + стратегия + стоимость ---------- */
  const filterState = { region: "", strategy: "", budget: "" };

  function applyFilters() {
    let list = PROJECTS.slice();
    if (filterState.region) list = list.filter((p) => p.region === filterState.region);
    if (filterState.strategy) {
      list =
        filterState.strategy === "invest"
          ? list.filter((p) => p.strategy.includes("rent") || p.strategy.includes("resale"))
          : list.filter((p) => p.strategy.includes(filterState.strategy));
    }
    if (filterState.budget) {
      const [min, max] = filterState.budget.split("-").map(Number);
      list = list.filter((p) => p.priceUsd >= min && (max ? p.priceUsd <= max : true));
    }
    render(list);
  }

  document.querySelectorAll("#filters .chip[data-region]").forEach((chip) =>
    chip.addEventListener("click", () => {
      document.querySelectorAll("#filters .chip[data-region]").forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      filterState.region = chip.dataset.region;
      applyFilters();
    })
  );

  document.querySelectorAll("#filters .chip[data-strategy]").forEach((chip) =>
    chip.addEventListener("click", () => {
      const wasActive = chip.classList.contains("is-active");
      document.querySelectorAll("#filters .chip[data-strategy]").forEach((c) => c.classList.remove("is-active"));
      if (!wasActive) chip.classList.add("is-active");
      filterState.strategy = wasActive ? "" : chip.dataset.strategy;
      applyFilters();
    })
  );

  const budgetSelect = document.getElementById("budget-select");
  if (budgetSelect) {
    budgetSelect.addEventListener("change", () => {
      filterState.budget = budgetSelect.value;
      applyFilters();
    });
  }

  /* ---------- Модалка проекта: галерея + данные ---------- */
  const pmodal = document.getElementById("project-modal");
  const pmImg = document.getElementById("pmodal-img");
  const pmBody = document.getElementById("pmodal-body");
  const pmCount = document.getElementById("pmodal-count");
  const pmPrev = pmodal.querySelector(".pmodal__nav--prev");
  const pmNext = pmodal.querySelector(".pmodal__nav--next");
  let gal = [];
  let gi = 0;

  function showImg() {
    pmImg.src = gal[gi];
    pmCount.textContent = gi + 1 + " / " + gal.length;
    const single = gal.length < 2;
    pmPrev.style.display = single ? "none" : "";
    pmNext.style.display = single ? "none" : "";
    pmCount.style.display = single ? "none" : "";
  }

  function openProject(id) {
    const p = PROJECTS.find((x) => x.id === id);
    if (!p) return;
    gal = p.gallery && p.gallery.length ? p.gallery : [p.img];
    gi = 0;
    showImg();

    // Поля выводим только при наличии реальных данных.
    // d.* — структура под данные клиента (см. data.js, WAITING_FOR_CLIENT_DATA)
    const d = p.details || {};
    const rows = [];
    const row = (label, val) =>
      val && rows.push('<div class="pmodal__row"><small>' + label + "</small><b>" + val + "</b></div>");
    row("Тип", p.type === "villa" ? "Виллы" : "Апартаменты");
    row("Стоимость", p.priceLabel);
    row("Площадь", p.areaLabel);
    row("Стратегии", p.strategyLabel);
    row("До моря", d.sea);
    row("Доходность", d.yield);
    row("Рассрочка", d.installment);
    row("Скидки застройщика", d.discounts);
    row("Варианты оплаты", d.payment);
    row("Планировки", d.layouts);

    const perks = (p.perks || []).map((t) => '<span class="pcard__perk">' + t + "</span>").join("");
    pmBody.innerHTML =
      '<div class="pmodal__loc">' + p.location + "</div>" +
      '<div class="pmodal__name">' + p.name + "</div>" +
      '<div class="pmodal__rows">' + rows.join("") + "</div>" +
      (p.desc ? '<p class="pmodal__desc">' + p.desc + "</p>" : "") +
      (perks ? '<div class="pmodal__perks">' + perks + "</div>" : "") +
      '<div class="pmodal__cta">' +
      '<button class="btn btn--gold" data-open-modal="Проект: ' + p.name + '">Получить подборку <span class="arr">→</span></button>' +
      (p.landing ? '<a class="btn btn--line-dark" href="' + p.landing + '">Лендинг проекта</a>' : "") +
      "</div>";

    pmodal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeProject(keepScrollLock) {
    pmodal.classList.remove("is-open");
    if (!keepScrollLock) document.body.style.overflow = "";
  }

  grid.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-modal]")) return; // врезка ведёт в лид-попап
    const card = e.target.closest(".pcard[data-project]");
    if (card) openProject(card.dataset.project);
  });

  pmPrev.addEventListener("click", () => { gi = (gi - 1 + gal.length) % gal.length; showImg(); });
  pmNext.addEventListener("click", () => { gi = (gi + 1) % gal.length; showImg(); });
  pmodal.querySelectorAll("[data-pmodal-close]").forEach((el) => el.addEventListener("click", () => closeProject()));
  document.addEventListener("keydown", (e) => {
    if (!pmodal.classList.contains("is-open")) return;
    if (e.key === "Escape") closeProject();
    if (e.key === "ArrowLeft") { gi = (gi - 1 + gal.length) % gal.length; showImg(); }
    if (e.key === "ArrowRight") { gi = (gi + 1) % gal.length; showImg(); }
  });
  // CTA внутри модалки проекта открывает лид-попап (обрабатывается в common.js) —
  // модалку проекта закрываем, блокировку скролла оставляем лид-попапу
  document.addEventListener("click", (e) => {
    if (e.target.closest("#project-modal [data-open-modal]")) closeProject(true);
  });
  // Свайп по галерее на тач-устройствах
  let touchX = null;
  const galEl = pmodal.querySelector(".pmodal__gallery");
  galEl.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  galEl.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40 && gal.length > 1) {
      gi = (gi + (dx < 0 ? 1 : -1) + gal.length) % gal.length;
      showImg();
    }
    touchX = null;
  }, { passive: true });

  /* ---------- Телефон в лид-попапе: код страны с флагом ---------- */
  const CC = [
    ["ru", "Россия", "+7"], ["kz", "Казахстан", "+7"], ["by", "Беларусь", "+375"], ["ua", "Украина", "+380"],
    ["uz", "Узбекистан", "+998"], ["kg", "Кыргызстан", "+996"], ["az", "Азербайджан", "+994"], ["am", "Армения", "+374"],
    ["ge", "Грузия", "+995"], ["th", "Таиланд", "+66"], ["ae", "ОАЭ", "+971"], ["tr", "Турция", "+90"],
    ["il", "Израиль", "+972"], ["de", "Германия", "+49"], ["gb", "Великобритания", "+44"], ["us", "США", "+1"]
  ];
  const cc = document.getElementById("phone-cc");
  if (cc) {
    const btn = cc.querySelector(".phone-cc__btn");
    const btnImg = btn.querySelector("img");
    const btnCode = cc.querySelector(".phone-cc__code");
    const list = cc.querySelector(".phone-cc__list");
    const phoneInput = cc.closest(".phone-row").querySelector("input[type=tel]");

    list.innerHTML = CC.map(
      (c, i) =>
        '<button type="button" class="phone-cc__item" data-i="' + i + '">' +
        '<img src="https://flagcdn.com/w20/' + c[0] + '.png" alt="' + c[1] + '">' +
        "<span>" + c[1] + "</span>" +
        '<span class="code">' + c[2] + "</span></button>"
    ).join("");

    const setCountry = (i) => {
      btnImg.src = "https://flagcdn.com/w20/" + CC[i][0] + ".png";
      btnImg.alt = CC[i][1];
      btnCode.textContent = CC[i][2];
    };
    btn.addEventListener("click", (e) => { e.stopPropagation(); cc.classList.toggle("is-open"); });
    list.addEventListener("click", (e) => {
      const it = e.target.closest(".phone-cc__item");
      if (!it) return;
      setCountry(+it.dataset.i);
      cc.classList.remove("is-open");
      phoneInput.focus();
    });
    document.addEventListener("click", (e) => { if (!cc.contains(e.target)) cc.classList.remove("is-open"); });
    // Ввод международного кода в поле телефона обновляет страну
    phoneInput.addEventListener("input", () => {
      const v = phoneInput.value.trim();
      if (!v.startsWith("+")) return;
      let best = -1, bestLen = 0;
      CC.forEach((c, i) => {
        if (v.startsWith(c[2]) && c[2].length > bestLen) { best = i; bestLen = c[2].length; }
      });
      if (best >= 0) setCountry(best);
    });
  }

  /* ---------- Плавающая кнопка квиза ---------- */
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

  /* ---------- Встроенный квиз ---------- */
  createQuiz(document.getElementById("quiz-container"), {
    resultImg: "assets/img/trisara-1.jpg",
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
      const top = matchProjects(answers, 3);
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
