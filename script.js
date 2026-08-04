const root = document.documentElement;
const lightToggle = document.querySelector("#light-theme-toggle");
const storageKey = "resume-theme-v3";

function blockSourceShortcuts(event) {
  const key = event.key.toLowerCase();
  const isControl = event.ctrlKey || event.metaKey;
  const isDevtoolsShortcut =
    event.key === "F12" ||
    (isControl && event.shiftKey && ["i", "j", "c"].includes(key)) ||
    (isControl && ["u", "s"].includes(key));

  if (isDevtoolsShortcut) {
    event.preventDefault();
    event.stopPropagation();
  }
}

document.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("dragstart", (event) => {
  if (event.target instanceof HTMLImageElement || event.target instanceof SVGElement) {
    event.preventDefault();
  }
});
document.addEventListener("keydown", blockSourceShortcuts, true);

function alignHashTarget() {
  if (!window.location.hash || window.location.hash.length < 2) {
    return;
  }

  const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));

  if (target) {
    target.scrollIntoView({ block: "start" });
  }
}

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

if (lightToggle) {
  const savedTheme = readTheme();
  setTheme(savedTheme === "graphite" ? "graphite" : "air");

  lightToggle.addEventListener("click", () => {
    const isDark = root.getAttribute("data-theme") === "graphite";
    setTheme(isDark ? "air" : "graphite");
  });
}

const revealTargets = document.querySelectorAll(
  [
    ".hero-copy .eyebrow",
    ".hero-copy h1",
    ".hero-copy .lead",
    ".hero-visual",
    ".hero-bottom",
    ".marquee",
    ".fact-row",
    ".focus-list article",
    ".job",
    ".skill-lines p",
    ".contacts-section",
  ].join(",")
);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const portfolioCaseTabs = Array.from(document.querySelectorAll("[data-case-target]"));
const portfolioCasePanels = Array.from(document.querySelectorAll("[data-case-panel]"));

function caseFromLocation() {
  const requestedCase = new URLSearchParams(window.location.search).get("case");
  return requestedCase === "svodika" || window.location.hash === "#case-svodika"
    ? "svodika"
    : "work-machine";
}

function clearCaseLocationToken() {
  const url = new URL(window.location.href);
  const hasCaseToken = url.searchParams.has("case") || url.hash === "#case-svodika";

  if (!hasCaseToken) {
    return;
  }

  url.searchParams.delete("case");
  url.hash = "";
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

function selectPortfolioCase(caseName) {
  if (!portfolioCaseTabs.length || !portfolioCasePanels.length) {
    return;
  }

  const scrollPosition = { left: window.scrollX, top: window.scrollY };

  portfolioCaseTabs.forEach((tab) => {
    const isActive = tab.dataset.caseTarget === caseName;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });

  portfolioCasePanels.forEach((panel) => {
    panel.hidden = panel.dataset.casePanel !== caseName;
  });

  window.scrollTo({ ...scrollPosition, behavior: "instant" });
}

portfolioCaseTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    selectPortfolioCase(tab.dataset.caseTarget);
    clearCaseLocationToken();
  });

  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const currentIndex = portfolioCaseTabs.indexOf(tab);
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? portfolioCaseTabs.length - 1
          : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + portfolioCaseTabs.length) %
            portfolioCaseTabs.length;
    const nextTab = portfolioCaseTabs[nextIndex];

    nextTab.focus();
    selectPortfolioCase(nextTab.dataset.caseTarget);
    clearCaseLocationToken();
  });
});

if (portfolioCaseTabs.length) {
  selectPortfolioCase(caseFromLocation());
  clearCaseLocationToken();
}

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

const lightbox = document.querySelector("#image-lightbox");
const lightboxImage = lightbox?.querySelector("img");
const lightboxDiagram = lightbox?.querySelector(".lightbox-diagram");
const lightboxClose = lightbox?.querySelector(".lightbox-close");
const lightboxPlaceholder = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

function closeLightbox() {
  if (!lightbox || !lightboxImage) {
    return;
  }

  lightbox.classList.remove("is-open");
  lightbox.classList.remove("is-diagram");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.src = lightboxPlaceholder;
  lightboxImage.alt = "";
  if (lightboxDiagram) {
    lightboxDiagram.hidden = true;
    lightboxDiagram.replaceChildren();
  }
  document.body.classList.remove("lightbox-open");
}

document.querySelectorAll(".case-zoom").forEach((button) => {
  button.addEventListener("click", () => {
    const image = button.querySelector("img");

    if (!lightbox || !lightboxImage || !image) {
      return;
    }

    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt;
    lightbox.classList.remove("is-diagram");
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    lightboxClose?.focus();
  });
});

document.querySelectorAll(".diagram-zoom").forEach((button) => {
  button.addEventListener("click", () => {
    const diagram = button.querySelector("svg");

    if (!lightbox || !lightboxDiagram || !diagram) {
      return;
    }

    const clone = diagram.cloneNode(true);
    clone.removeAttribute("id");
    clone.setAttribute("aria-hidden", "true");
    lightboxImage.src = lightboxPlaceholder;
    lightboxImage.alt = "";
    lightboxDiagram.replaceChildren(clone);
    lightboxDiagram.hidden = false;
    lightbox.classList.add("is-open", "is-diagram");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    lightboxClose?.focus();
  });
});

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox || event.target === lightboxImage) {
    closeLightbox();
  }
});

lightboxDiagram?.addEventListener("click", closeLightbox);

lightboxClose?.addEventListener("click", closeLightbox);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox?.classList.contains("is-open")) {
    closeLightbox();
  }
});

window.addEventListener("load", () => {
  alignHashTarget();
  window.setTimeout(alignHashTarget, 120);
});

window.addEventListener("hashchange", () => {
  selectPortfolioCase(caseFromLocation());

  if (window.location.hash === "#case-svodika") {
    clearCaseLocationToken();
    return;
  }

  window.setTimeout(alignHashTarget, 0);
});
