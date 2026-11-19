
(() => {
  const FEED = "https://bibliotheek.windesheim.nl/public/carrousel.json";
  const ROOT_ID = "windesheim-koha-carousel";

  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function safeUrl(value, allowedHosts) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" &&
        allowedHosts.includes(url.hostname) ? url.href : null;
    } catch {
      return null;
    }
  }

  function buildCarousel(group) {
    const section = make("section", "wh-carousel");
    section.append(make("h2", "wh-carousel-title", group.title || "Aanbevolen boeken"));

    const viewport = make("div", "wh-viewport");
    const track = make("div", "wh-track");

    (group.documents || []).forEach(book => {
      const imageUrl = safeUrl(book.image, ["images-na.ssl-images-amazon.com"]);
      const bookUrl = safeUrl(book.url, ["bibliotheek.windesheim.nl"]);

      if (!imageUrl || !bookUrl || !book.title) return;

      const card = make("article", "wh-book");
      const link = make("a", "wh-book-link");
      link.href = bookUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", `Bekijk ${book.title} in de catalogus`);

      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = book.title;
      image.loading = "lazy";
      image.onerror = () => card.remove();

      link.append(image);
      card.append(link);
      card.append(make("div", "wh-book-title", book.title));

      if (book.author) {
        card.append(make("div", "wh-book-author", book.author));
      }

      track.append(card);
    });

    if (!track.children.length) return null;

    viewport.append(track);

    const controls = make("div", "wh-controls");
    const previous = make("button", "wh-button", "‹");
    const next = make("button", "wh-button", "›");

    previous.type = next.type = "button";
    previous.setAttribute("aria-label", "Vorige boeken");
    next.setAttribute("aria-label", "Volgende boeken");

    const move = direction => {
      viewport.scrollBy({
        left: direction * Math.max(220, viewport.clientWidth * 0.8),
        behavior: "smooth"
      });
    };

    previous.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));

    controls.append(previous, next);
    section.append(viewport, controls);

    let timer;
    const start = () => {
      stop();
      timer = setInterval(() => {
        if (viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 5) {
          viewport.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          move(1);
        }
      }, 5000);
    };
    const stop = () => clearInterval(timer);

    section.addEventListener("mouseenter", stop);
    section.addEventListener("mouseleave", start);
    section.addEventListener("focusin", stop);
    section.addEventListener("focusout", start);

    start();
    return section;
  }

  async function init() {
    const root = document.getElementById(ROOT_ID);
    if (!root) return;

    root.textContent = "Boeken laden…";

    try {
      const response = await fetch(FEED, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const groups = await response.json();
      if (!Array.isArray(groups)) throw new Error("Ongeldig JSON-formaat");

      root.replaceChildren();

      groups.forEach(group => {
        const carousel = buildCarousel(group);
        if (carousel) root.append(carousel);
      });

      if (!root.children.length) {
        root.textContent = "Er zijn momenteel geen boeken beschikbaar.";
      }
    } catch (error) {
      console.error("Koha carousel:", error);
      root.textContent = "De boeken konden niet worden geladen.";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

