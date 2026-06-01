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
  window.setTimeout(alignHashTarget, 0);
});
