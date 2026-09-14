/* Cookie-баннер: Метрика загружается только после «ОК». */
(function () {
  var KEY = "alvo_cookie_ok";
  var ID = 111132899;

  function loadMetrika() {
    if (window.__alvoYm) return;
    window.__alvoYm = true;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      for (var j = 0; j < document.scripts.length; j++) {
        if (document.scripts[j].src === r) return;
      }
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=" + ID, "ym");
    ym(ID, "init", {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: "dataLayer",
      referrer: document.referrer,
      url: location.href,
      accurateTrackBounce: true,
      trackLinks: true
    });
  }

  function showBanner() {
    if (document.querySelector(".cookie-bar")) return;
    var bar = document.createElement("div");
    bar.className = "cookie-bar";
    bar.setAttribute("role", "dialog");
    bar.setAttribute("aria-label", "Согласие на cookie");
    bar.innerHTML =
      '<p class="cookie-bar__text">Мы используем файлы cookie и Яндекс.Метрику, чтобы сайт работал стабильно и мы понимали, как им пользуются. Нажимая «ОК», вы соглашаетесь с этим. Подробнее — в <a href="privacy.html">политике конфиденциальности</a>.</p>' +
      '<button type="button" class="cookie-bar__ok">ОК</button>';
    document.body.appendChild(bar);
    bar.querySelector(".cookie-bar__ok").addEventListener("click", function () {
      try { localStorage.setItem(KEY, "1"); } catch (err) {}
      loadMetrika();
      bar.classList.add("is-out");
      setTimeout(function () { bar.remove(); }, 280);
    });
  }

  function start() {
    try {
      if (localStorage.getItem(KEY) === "1") loadMetrika();
      else showBanner();
    } catch (err) {
      showBanner();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
