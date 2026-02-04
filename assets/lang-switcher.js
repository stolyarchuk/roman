(function () {
  // mark current language button as active, set aria-current and add basic keyboard handling
  const pageLang =
    document.documentElement.lang ||
    (location.pathname.startsWith("/ru") ? "ru" : "en");
  document.querySelectorAll(".lang-switcher .lang").forEach(function (a) {
    if (a.dataset.lang === pageLang) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    }
    // make Space/Enter activate the link for keyboard users
    a.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        a.click();
      }
    });
  });
})();
