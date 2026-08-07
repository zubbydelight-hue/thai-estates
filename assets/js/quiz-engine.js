/* Универсальный движок квиза.
   createQuiz(container, { questions, renderResult, flat })
   Вопрос: { key, label, question, hint, wide, options: [{ value, label, sub, icon }] } */

function createQuiz(container, config) {
  const answers = {};
  let step = 0;
  const total = config.questions.length;

  container.innerHTML =
    '<div class="quiz' + (config.flat ? " quiz--flat" : "") + '">' +
    '<div class="quiz__progress"><div class="quiz__progress-bar"></div></div>' +
    '<div class="quiz__body"></div>' +
    "</div>";

  const body = container.querySelector(".quiz__body");
  const bar = container.querySelector(".quiz__progress-bar");

  function renderStep() {
    const q = config.questions[step];
    bar.style.width = (step / total) * 100 + "%";

    body.innerHTML =
      '<div class="quiz__step-label">Шаг ' + (step + 1) + " из " + total + "</div>" +
      '<div class="quiz__question">' + q.question + "</div>" +
      (q.hint ? '<p class="quiz__hint">' + q.hint + "</p>" : "") +
      '<div class="quiz__options' + (q.wide ? " quiz__options--wide" : "") + '">' +
      q.options
        .map(
          (o, i) =>
            '<button type="button" class="quiz-opt' +
            (answers[q.key] === o.value ? " is-selected" : "") +
            '" data-i="' + i + '">' +
            (o.icon ? '<span class="quiz-opt__icon">' + o.icon + "</span>" : "") +
            '<span class="quiz-opt__label">' + o.label +
            (o.sub ? "<small>" + o.sub + "</small>" : "") +
            "</span></button>"
        )
        .join("") +
      "</div>" +
      '<div class="quiz__nav">' +
      '<button type="button" class="quiz__back"' + (step === 0 ? " hidden" : "") + ">&larr; Назад</button>" +
      '<span class="form-note">Займёт меньше минуты</span>' +
      "</div>";

    body.querySelectorAll(".quiz-opt").forEach((btn) =>
      btn.addEventListener("click", () => {
        const opt = q.options[+btn.dataset.i];
        answers[q.key] = opt.value;
        btn.classList.add("is-selected");
        setTimeout(() => {
          if (step < total - 1) {
            step++;
            renderStep();
          } else {
            renderResult();
          }
        }, 250);
      })
    );
    body.querySelector(".quiz__back")?.addEventListener("click", () => {
      if (step > 0) {
        step--;
        renderStep();
      }
    });
  }

  function renderResult() {
    bar.style.width = "100%";
    body.innerHTML = config.renderResult(answers);

    const form = body.querySelector("form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        body.innerHTML =
          '<div style="text-align:center;padding:40px 10px">' +
          '<div style="font-size:52px;line-height:1">✓</div>' +
          '<div class="quiz__question" style="margin:18px 0 10px">Спасибо! Подборка уже готовится</div>' +
          '<p class="quiz__hint" style="margin-bottom:0">Менеджер свяжется с вами в течение 15 минут и отправит персональную подборку с ценами, планировками и условиями рассрочки.</p>' +
          "</div>";
      });
    }
  }

  renderStep();
}

/* Подбор проектов по ответам квиза (для каталога и квиза-подборки).
   Скоринг вместо жёстких фильтров — всегда возвращает `limit` проектов. */
function matchProjects(answers, limit) {
  let budgetMin = 0, budgetMax = Infinity;
  if (answers.budget) {
    const parts = answers.budget.split("-");
    budgetMin = Number(parts[0]) || 0;
    budgetMax = parts[1] ? Number(parts[1]) : Infinity;
  }
  const budgetMid = budgetMax === Infinity ? budgetMin * 1.5 || 3000000 : (budgetMin + budgetMax) / 2;

  const scored = PROJECTS.map((p) => {
    let score = 0;
    if (answers.strategy && p.strategy.includes(answers.strategy)) score += 40;
    if (answers.region && answers.region !== "any" && p.region === answers.region) score += 25;
    if (answers.type && answers.type !== "any" && p.type === answers.type) score += 20;
    if (p.priceUsd >= budgetMin && p.priceUsd <= budgetMax) {
      score += 30;
    } else {
      // штраф пропорционален удалённости цены от бюджета
      const dist = Math.abs(p.priceUsd - budgetMid) / Math.max(budgetMid, 1);
      score -= Math.min(25, dist * 12);
    }
    return { p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit || 3).map((s) => s.p);
}

function miniCardsHtml(projects) {
  return (
    '<div class="quiz__result-grid">' +
    projects
      .map(
        (p) =>
          '<a class="quiz-mini-card" href="' + (p.landing || "#") + '"' + (p.landing ? "" : ' onclick="return false"') + ">" +
          '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy">' +
          '<div class="quiz-mini-card__body">' +
          '<div class="quiz-mini-card__name">' + p.name + "</div>" +
          '<div class="quiz-mini-card__meta">' + p.location + " · " + p.strategyLabel + "</div>" +
          '<div class="quiz-mini-card__price">' + p.priceLabel + "</div>" +
          "</div></a>"
      )
      .join("") +
    "</div>"
  );
}

function leadFormHtml(buttonText) {
  return (
    '<form class="quiz__form">' +
    '<div class="quiz__form-row">' +
    '<input class="input" type="text" name="name" placeholder="Ваше имя" required>' +
    '<input class="input" type="tel" name="phone" placeholder="+7 (___) ___-__-__" required>' +
    "</div>" +
    '<button class="btn btn--gold btn--lg btn--block" type="submit">' + (buttonText || "Получить подборку") + "</button>" +
    '<span class="form-note text-center">Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности. Это демо — данные никуда не отправляются.</span>' +
    "</form>"
  );
}
