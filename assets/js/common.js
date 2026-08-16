/* Общая логика: бургер, модалка заявки, формы, FAQ */

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

  // Демо-отправка форм
  document.querySelectorAll("form[data-demo-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector("button[type=submit]");
      btn.textContent = "Отправляем…";
      btn.disabled = true;
      setTimeout(() => {
        form.innerHTML =
          '<div style="text-align:center;padding:26px 6px">' +
          '<div style="font-family:var(--ff-d);font-size:46px;line-height:1;color:var(--gold)">✓</div>' +
          '<div class="h3" style="margin:16px 0 10px">Заявка отправлена</div>' +
          '<p class="form-note" style="font-size:14px">Менеджер свяжется с вами в течение 15 минут и вышлет подборку с ценами и планировками</p>' +
          "</div>";
      }, 900);
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
