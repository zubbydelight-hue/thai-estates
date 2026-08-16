/* Универсальный движок квиза.
   createQuiz(container, { questions, renderResult, flat, side, img, resultImg })
   Вопрос: { key, question, hint, img, options: [{ value, label, sub, icon, img }] }
   side: false — без визуальной панели слева (для страниц со своим сайдбаром) */

function createQuiz(container, config) {
  const answers = {};
  let step = 0;
  const total = config.questions.length;
  const pad = (n) => (n < 10 ? "0" + n : "" + n);
  const hasSide = config.side !== false;
  const defaultImg = config.img || (config.questions.find((q) => q.img) || {}).img || "";

  container.innerHTML =
    '<div class="quiz' + (config.flat ? " quiz--flat" : "") + (hasSide ? "" : " quiz--noside") + '">' +
    (hasSide
      ? '<aside class="quiz__side">' +
        '<div class="quiz__side-media"><img alt=""></div>' +
        '<div class="quiz__side-head"><span class="quiz__side-num"></span><span class="quiz__side-of">из ' + pad(total) + "</span></div>" +
        (config.bullets && config.bullets.length
          ? '<ul class="quiz__side-bullets">' + config.bullets.map((b) => "<li>" + b + "</li>").join("") + "</ul>"
          : "") +
        '<div class="quiz__side-agent">' +
        '<img src="assets/img/kun-ping.jpg" alt="Kun Ping">' +
        "<div><b>Kun Ping</b><span>изучит ответы и подберёт варианты лично</span></div>" +
        "</div>" +
        "</aside>"
      : "") +
    '<div class="quiz__main">' +
    '<div class="quiz__progress"><div class="quiz__progress-bar"></div></div>' +
    '<div class="quiz__body"></div>' +
    "</div></div>";

  const body = container.querySelector(".quiz__body");
  const bar = container.querySelector(".quiz__progress-bar");
  const sideImg = container.querySelector(".quiz__side-media img");
  const sideNum = container.querySelector(".quiz__side-num");

  function updateSide(img, num) {
    if (!hasSide) return;
    sideNum.textContent = num;
    const src = img || defaultImg;
    if (src && sideImg.getAttribute("src") !== src) {
      sideImg.style.opacity = "0";
      const pre = new Image();
      pre.onload = () => {
        sideImg.src = src;
        sideImg.style.opacity = "";
      };
      pre.src = src;
    }
  }

  function renderStep() {
    const q = config.questions[step];
    bar.style.width = ((step + 1) / (total + 1)) * 100 + "%";
    updateSide(q.img, pad(step + 1));

    const isCards = q.options.some((o) => o.img);
    const optionsHtml = q.options
      .map((o, i) => {
        const sel = answers[q.key] === o.value ? " is-selected" : "";
        if (isCards) {
          return (
            '<button type="button" class="quiz-card' + sel + '" data-i="' + i + '">' +
            (o.img
              ? '<span class="quiz-card__media"><img src="' + o.img + '" alt="" loading="lazy"></span>'
              : '<span class="quiz-card__media quiz-card__media--empty"><i>' + (o.icon || "") + "</i></span>") +
            '<span class="quiz-card__label">' + o.label + (o.sub ? "<small>" + o.sub + "</small>" : "") + "</span>" +
            '<span class="quiz-card__check">✓</span>' +
            "</button>"
          );
        }
        return (
          '<button type="button" class="quiz-opt' + sel + '" data-i="' + i + '">' +
          (o.icon ? '<span class="quiz-opt__icon">' + o.icon + "</span>" : "") +
          '<span class="quiz-opt__label">' + o.label + (o.sub ? "<small>" + o.sub + "</small>" : "") + "</span>" +
          "</button>"
        );
      })
      .join("");

    body.innerHTML =
      '<div class="quiz__step">' +
      '<div class="quiz__step-label">Вопрос ' + (step + 1) + " из " + total + "</div>" +
      '<div class="quiz__question">' + q.question + "</div>" +
      (q.hint ? '<p class="quiz__hint">' + q.hint + "</p>" : "") +
      '<div class="quiz__options' + (isCards ? " quiz__options--cards" : "") + '">' + optionsHtml + "</div>" +
      '<div class="quiz__nav">' +
      '<button type="button" class="quiz__back"' + (step === 0 ? " hidden" : "") + ">&larr; Назад</button>" +
      '<span class="form-note">Займёт меньше минуты</span>' +
      "</div></div>";

    body.querySelectorAll(".quiz-opt, .quiz-card").forEach((btn) =>
      btn.addEventListener("click", () => {
        const opt = q.options[+btn.dataset.i];
        answers[q.key] = opt.value;
        body.querySelectorAll(".is-selected").forEach((b) => b.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        setTimeout(() => {
          if (step < total - 1) {
            step++;
            renderStep();
          } else {
            renderResult();
          }
        }, 350);
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
    updateSide(config.resultImg, "✓");
    body.innerHTML = '<div class="quiz__step">' + config.renderResult(answers) + "</div>";

    const form = body.querySelector("form");
    if (form) {
      if (window.enhancePhone) window.enhancePhone(form.querySelector('input[type="tel"]'));
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const btn = form.querySelector("button[type=submit]");
        const btnHtml = btn.innerHTML;
        // письмо: телефон + читаемые ответы квиза (лейблы выбранных опций)
        const fields = {
          "Источник": "Квиз — подбор проектов",
          "Телефон": form.querySelector('input[type="tel"]')?.value.trim() || "",
          "Страница": location.href
        };
        (config.questions || []).forEach((q, i) => {
          const opt = q.options.find((o) => o.value === answers[q.key]);
          if (opt) fields["Квиз " + (i + 1) + ". " + q.question] = opt.label;
        });

        btn.textContent = "Отправляем…";
        btn.disabled = true;
        form.querySelector(".form-send-error")?.remove();

        const send = window.sendLead ? window.sendLead(fields) : Promise.resolve();
        send
          .then(() => {
            body.innerHTML =
              '<div style="text-align:center;padding:40px 10px">' +
              '<div style="font-size:52px;line-height:1">✓</div>' +
              '<div class="quiz__question" style="margin:18px 0 10px">Спасибо! Подборка уже готовится</div>' +
              '<p class="quiz__hint" style="margin-bottom:0">Менеджер свяжется с вами в течение 15 минут и отправит персональную подборку с ценами, планировками и условиями рассрочки</p>' +
              "</div>";
          })
          .catch(() => {
            btn.innerHTML = btnHtml;
            btn.disabled = false;
            const err = document.createElement("span");
            err.className = "form-note text-center form-send-error";
            err.style.color = "#c96f5b";
            err.textContent = "Не получилось отправить — попробуйте ещё раз или позвоните: +66 80 000 00 00";
            btn.insertAdjacentElement("afterend", err);
          });
      });
    }
  }

  renderStep();
}

/* Подбор проектов по ответам квиза (для каталога и квиза-подборки).
   Скоринг вместо жёстких фильтров — всегда возвращает `limit` проектов. */
function matchProjects(answers, limit, pool) {
  const source = pool || PROJECTS;
  let budgetMin = 0, budgetMax = Infinity;
  if (answers.budget) {
    const parts = answers.budget.split("-");
    budgetMin = Number(parts[0]) || 0;
    budgetMax = parts[1] ? Number(parts[1]) : Infinity;
  }
  const budgetMid = budgetMax === Infinity ? budgetMin * 1.5 || 3000000 : (budgetMin + budgetMax) / 2;

  const scored = source.map((p) => {
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
    '<input class="input" type="tel" name="phone" placeholder="+7 900 000-00-00" autocomplete="tel" required>' +
    '<button class="btn btn--gold btn--lg btn--block" type="submit">' + (buttonText || "Получить подборку") + "</button>" +
    '<label class="consent"><input type="checkbox" name="consent" required><span>Соглашаюсь с <a href="privacy.html" target="_blank" rel="noopener">политикой обработки персональных данных</a></span></label>' +
    "</form>"
  );
}
