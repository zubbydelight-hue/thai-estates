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

  function render(list) {
    grid.innerHTML = list.map(cardHtml).join("");
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

  // Встроенный квиз
  createQuiz(document.getElementById("quiz-container"), {
    questions: [
      {
        key: "strategy",
        question: "Какая у вас цель?",
        hint: "От этого зависит стратегия и тип проекта.",
        options: [
          { value: "rent", label: "Пассивный доход с аренды", sub: "до 10% годовых", icon: "01" },
          { value: "resale", label: "Заработать на росте цены", sub: "вход на стройке, выход на сдаче", icon: "02" },
          { value: "live", label: "Жильё для себя и семьи", sub: "переезд или зимовки", icon: "03" },
          { value: "private", label: "Приватная коллекция", sub: "виллы от $1.5M", icon: "04" }
        ]
      },
      {
        key: "region",
        question: "Какой регион вам ближе?",
        options: [
          { value: "phuket", label: "Пхукет", sub: "остров, премиум-курорты", icon: "01" },
          { value: "pattaya", label: "Паттайя", sub: "город у моря, низкий порог входа", icon: "02" },
          { value: "any", label: "Рассмотрю оба варианта", sub: "покажем лучшее из двух регионов", icon: "03" }
        ]
      },
      {
        key: "type",
        question: "Апартаменты или вилла?",
        options: [
          { value: "condo", label: "Апартаменты", sub: "проще сдавать, ниже вход", icon: "01" },
          { value: "villa", label: "Вилла", sub: "приватность и территория", icon: "02" },
          { value: "any", label: "Не принципиально", sub: "подберём по бюджету и цели", icon: "03" }
        ]
      },
      {
        key: "budget",
        question: "Какой бюджет рассматриваете?",
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
