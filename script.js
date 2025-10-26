/* ==========================================================
 🌈 Rainbow School — script.js
 Gère les thèmes, transitions entre pages, et la popup musique
========================================================== */

/* === Thème White/Dark fluide === */
(function() {
  const btn = document.getElementById("themeToggle");
  const root = document.documentElement;
  const body = document.body;

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) root.setAttribute("data-theme", savedTheme);

  function toggleTheme() {
    body.classList.add("fade-theme");
    const current = root.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);

    setTimeout(() => {
      body.classList.add("active");
      setTimeout(() => body.classList.remove("fade-theme", "active"), 400);
    }, 50);
  }

  if (btn) btn.addEventListener("click", toggleTheme);
})();

/* === Transition entre les pages === */
document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("page-enter");
  setTimeout(() => document.body.classList.add("page-enter-active"), 20);

  const links = document.querySelectorAll('a[href]');
  links.forEach(link => {
    if (link.getAttribute('target') === '_blank' || link.href.includes('#')) return;
    link.addEventListener('click', e => {
      e.preventDefault();
      document.body.classList.add("page-exit");
      setTimeout(() => { window.location = link.href; }, 300);
    });
  });
});

/* === Popup SoundCloud === */
(function() {
  const popup = document.getElementById("scPopup");
  if (!popup) return;
  const closeBtn = popup.querySelector(".close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      popup.style.transition = "opacity 0.4s ease";
      popup.style.opacity = "0";
      setTimeout(() => popup.remove(), 400);
    });
  }
})();