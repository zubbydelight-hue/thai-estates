/* Каталог: рендер карточек, фильтры, встроенный квиз */

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("cards-grid");
  const count = document.getElementById("catalog-count");
  let firstRender = true;

  function cardHtml(p) {
    const media = p.landing
      ? '<a class="pcard__media" data-parallax-skip href="' + p.landing + '">'
      : '<div class="pcard__media">';
    const mediaClose = p.landing ? "</a>" : "</div>";
    const go = p.landing ? '<span class="pcard__go">→</span>' : "";
    const cta = p.landing
      ? '<a class="pcard__btn" href="' + p.landing + '">Смотреть проект <span>→</span></a>'
      : '<button class="pcard__btn" data-open-modal="' + p.name + '">Узнать цену и планировки <span>→</span></button>';
    const perks = (p.perks || [])
      .map((t) => '<span class="pcard__perk">' + t + "</span>")
      .join("");
    return (
      '<article class="pcard">' +
      media +
      '<div class="pcard__tags">' +
      '<span class="pcard__tag">' + p.strategyLabel + "</span>" +
      '<span class="pcard__tag">' + (p.type === "villa" ? "Виллы" : "Апартаменты") + "</span>" +
      "</div>" +
      '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy">' +
      go +
      mediaClose +
      '<div class="pcard__body">' +
      '<div class="pcard__loc">' + p.location + "</div>" +
      '<h3 class="pcard__name">' + p.name + "</h3>" +
      '<div class="pcard__specs">' +
      '<div class="pcard__spec"><small>Стоимость</small><b>' + p.priceLabel + "</b></div>" +
      '<div class="pcard__spec"><small>Площадь</small><b>' + (p.areaLabel || "—") + "</b></div>" +
      "</div>" +
      (perks ? '<div class="pcard__perks">' + perks + "</div>" : "") +
      '<p class="pcard__desc">' + p.desc + "</p>" +
      '<div class="pcard__foot">' + cta + "</div></div></article>"
    );
  }

  // Врезка-тизер квиза внутри сетки лотов
  const quizTeaserHtml =
    '<div class="pcard pcard--teaser">' +
    '<div class="pcard-teaser__inner">' +
    '<span class="pcard-teaser__label">Квиз · 1 минута</span>' +
    '<div class="pcard-teaser__title">Не можете выбрать из 18 проектов?</div>' +
    '<p class="pcard-teaser__text">Ответьте на 4 вопроса — алгоритм покажет ваш топ-3 с ценами и пришлём подробный расчёт.</p>' +
    '<a class="btn btn--gold" href="#quiz">Пройти подбор <span class="arr">→</span></a>' +
    "</div></div>";

  function render(list) {
    const cardsHtml = list.map(cardHtml);
    // после 6-й карточки — призыв пройти квиз
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

  document.querySelectorAll("#filters .chip").forEach((chip) =>
    chip.addEventListener("click", () => {
      document.querySelectorAll("#filters .chip").forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      const f = chip.dataset.filter;
      if (f === "all") return render(PROJECTS);
      const [kind, val] = f.split(":");
      if (kind === "region") return render(PROJECTS.filter((p) => p.region === val));
      if (kind === "strategy") return render(PROJECTS.filter((p) => p.strategy.includes(val)));
      if (kind === "budget") {
        const [min, max] = val.split("-").map(Number);
        return render(PROJECTS.filter((p) => p.priceUsd >= min && (max ? p.priceUsd <= max : true)));
      }
    })
  );

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

  document.querySelectorAll('form input[type="tel"]').forEach((input) => {
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
  });

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
    questions: [
      {
        key: "strategy",
        question: "Какая у вас цель?",
        hint: "От этого зависит стратегия и тип проекта.",
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
        '<p class="quiz__hint">Оставьте контакты — пришлём полную подборку с ценами, планировками и расчётом доходности по каждому проекту.</p>' +
        miniCardsHtml(top) +
        leadFormHtml("Получить подборку с ценами")
      );
    }
  });
});
