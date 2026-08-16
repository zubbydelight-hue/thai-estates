/* Общая логика: бургер, модалка заявки, формы, FAQ */

/* ============================================================
   ЗАЯВКИ НА ПОЧТУ (для интеграции с amoCRM)

   Заявки отправляются письмом через сервис formsubmit.co
   на адрес LEAD_EMAIL. Тема письма собирается по шаблону
   «Заявка ALVO | <источник> | <телефон>» — из неё интегратор
   вытаскивает данные для идентификации заявки в amoCRM.
   В теле письма — таблица: источник, телефон (+7 …),
   способ связи, ответы квиза, страница.

   Как включить:
   1. Впишите почту для заявок в LEAD_EMAIL ниже.
   2. Отправьте первую заявку с сайта — formsubmit.co пришлёт
      на эту почту письмо со ссылкой активации. Подтвердите
      один раз, дальше заявки идут автоматически.
   Пока LEAD_EMAIL пустой, формы работают в демо-режиме.
   ============================================================ */
const LEAD_EMAIL = "il.ya.ok.03@gmail.com"; // ← почта для заявок (сейчас тестовая)

window.sendLead = function (fields) {
  if (!LEAD_EMAIL) {
    console.warn("LEAD_EMAIL не указан — заявка не отправлена (демо-режим)", fields);
    return new Promise((resolve) => setTimeout(() => resolve({ demo: true }), 700));
  }
  const payload = Object.assign(
    {
      _subject: "Заявка ALVO | " + (fields["Источник"] || "сайт") + " | " + (fields["Телефон"] || ""),
      _template: "table",
      _captcha: "false"
    },
    fields
  );
  return fetch("https://formsubmit.co/ajax/" + LEAD_EMAIL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload)
  }).then((r) => {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json().then((data) => {
      // formsubmit отвечает 200 даже без активации формы — проверяем флаг
      if (String(data.success) === "false") throw new Error(data.message || "not activated");
      return data;
    });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  // Бургер
  const burger = document.querySelector(".nav__burger");
  const links = document.querySelector(".nav__links");
  if (burger && links) {
    const nav = document.querySelector(".nav");
    const closeMenu = () => {
      burger.classList.remove("is-open");
      links.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      document.body.style.overflow = "";
    };
    burger.addEventListener("click", () => {
      const willOpen = !links.classList.contains("is-open");
      burger.classList.toggle("is-open", willOpen);
      links.classList.toggle("is-open", willOpen);
      document.body.classList.toggle("menu-open", willOpen);
      document.body.style.overflow = willOpen ? "hidden" : "";
      if (willOpen && nav) nav.classList.remove("is-hidden");
    });
    links.querySelectorAll("a, button").forEach((el) => el.addEventListener("click", closeMenu));
  }

  // Модалка заявки
  const modal = document.getElementById("lead-modal");
  if (modal) {
    const open = (source) => {
      modal.classList.add("is-open");
      document.body.style.overflow = "hidden";
      // источник заявки пишем в скрытое поле формы, а не в видимый текст
      const src = modal.querySelector("input[data-lead-source]");
      if (src && source) src.value = source;
    };
    const close = () => {
      modal.classList.remove("is-open");
      document.body.style.overflow = "";
    };
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-open-modal]");
      if (btn) open(btn.dataset.openModal);
    });
    modal.querySelector(".modal__backdrop")?.addEventListener("click", close);
    modal.querySelector(".modal__close")?.addEventListener("click", close);
    document.addEventListener("keydown", (e) => e.key === "Escape" && close());
  }

  // Отправка форм: собираем источник + телефон и шлём письмо (см. sendLead выше)
  document.querySelectorAll("form[data-demo-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector("button[type=submit]");
      const btnHtml = btn.innerHTML;
      const fields = {
        "Источник": form.querySelector('input[name="lead_source"]')?.value || "Сайт",
        "Телефон": form.querySelector('input[type="tel"]')?.value.trim() || "",
        "Страница": location.href
      };
      const method = form.querySelector('input[name="method"]:checked')?.value;
      if (method) fields["Способ связи"] = method;

      btn.textContent = "Отправляем…";
      btn.disabled = true;
      form.querySelector(".form-send-error")?.remove();

      window
        .sendLead(fields)
        .then(() => {
          form.innerHTML =
            '<div style="text-align:center;padding:26px 6px">' +
            '<div style="font-family:var(--ff-d);font-size:46px;line-height:1;color:var(--gold)">✓</div>' +
            '<div class="h3" style="margin:16px 0 10px">Заявка отправлена</div>' +
            '<p class="form-note" style="font-size:14px">Менеджер свяжется с вами в течение 15 минут и вышлет подборку с ценами и планировками</p>' +
            "</div>";
        })
        .catch(() => {
          btn.innerHTML = btnHtml;
          btn.disabled = false;
          const err = document.createElement("span");
          err.className = "form-note form-send-error";
          err.style.color = "#c96f5b";
          err.textContent = "Не получилось отправить — попробуйте ещё раз или позвоните: +66 80 000 00 00";
          btn.insertAdjacentElement("afterend", err);
        });
    });
  });

  // FAQ-аккордеон
  document.querySelectorAll(".faq__item").forEach((item) => {
    const q = item.querySelector(".faq__q");
    const a = item.querySelector(".faq__a");
    q.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      item.closest(".faq").querySelectorAll(".faq__item.is-open").forEach((o) => {
        o.classList.remove("is-open");
        o.querySelector(".faq__a").style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add("is-open");
        a.style.maxHeight = a.scrollHeight + "px";
      }
    });
  });
});
