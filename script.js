const root = document.documentElement;
const lightToggle = document.querySelector("#light-theme-toggle");
const storageKey = "resume-theme-v3";

function readTheme() {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // file:// previews can block storage; theme switching should still work.
  }
}

function setTheme(theme) {
  root.setAttribute("data-theme", theme);
  if (lightToggle) {
    lightToggle.setAttribute("aria-pressed", theme === "air" ? "true" : "false");
  }
  saveTheme(theme);
}

const savedTheme = readTheme();
setTheme(savedTheme === "air" ? "air" : "graphite");

lightToggle?.addEventListener("click", () => {
  const isDark = root.getAttribute("data-theme") === "graphite";
  setTheme(isDark ? "air" : "graphite");
});

const revealTargets = document.querySelectorAll(
  [
    ".hero-copy .eyebrow",
    ".hero-copy h1",
    ".hero-copy .lead",
    ".hero-visual",
    ".hero-bottom",
    ".marquee",
    ".editorial-section",
    ".fact-row",
    ".focus-list article",
    ".job",
    ".skill-lines p",
    ".contacts-section",
  ].join(",")
);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduceMotion && "IntersectionObserver" in window) {
  revealTargets.forEach((element, index) => {
    element.classList.add("reveal");
    element.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 70}ms`);
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -8%",
    }
  );

  revealTargets.forEach((element) => revealObserver.observe(element));
} else {
  revealTargets.forEach((element) => element.classList.add("is-visible"));
}
