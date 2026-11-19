
(() => {
  const FEED = "https://bibliotheek.windesheim.nl/public/carrousel.json";
  const ROOT_ID = "windesheim-koha-carousel";
  const initialized = new WeakSet();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function safeUrl(value, hosts) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && hosts.includes(url.hostname)
        ? url.href : null;
    } catch {
      return null;
    }
  }

  function buildCarousel(group) {
    const section = make("section", "wh-carousel");
    section.append(make("h2", "wh-carousel-title",
      group.title || "Aanbevolen boeken"));

    const viewport = make("div", "wh-viewport");
    viewport.setAttribute("aria-label", group.title || "Boeken");
    const track = make("div", "wh-track");

    (group.documents || []).forEach(book => {
      const imageUrl = safeUrl(book.image, [
        "images-na.ssl-images-amazon.com"
      ]);
      const bookUrl = safeUrl(book.url, [
        "bibliotheek.windesheim.nl"
      ]);

      if (!imageUrl || !bookUrl || !book.title) return;

      const card = make("article", "wh-book");
      const link = make("a", "wh-book-link");
      link.href = bookUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label",
        `Bekijk ${book.title} in de catalogus`);

      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = book.title;
      image.loading = "lazy";
      image.onerror = () => card.remove();

      link.append(image);
      card.append(link, make("div", "wh-book-title", book.title));

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

    const move = direction => viewport.scrollBy({
      left: direction * Math.max(220, viewport.clientWidth * 0.8),
      behavior: reducedMotion.matches ? "auto" : "smooth"
    });

    previous.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    controls.append(previous, next);
    section.append(viewport, controls);

    let timer;
    const stop = () => clearInterval(timer);
    const start = () => {
      stop();
      if (reducedMotion.matches) return;
      timer = setInterval(() => {
        if (viewport.scrollLeft + viewport.clientWidth >=
            viewport.scrollWidth - 5) {
          viewport.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          move(1);
        }
      }, 5000);
    };

    section.addEventListener("mouseenter", stop);
    section.addEventListener("mouseleave", start);
    section.addEventListener("focusin", stop);
    section.addEventListener("focusout", event => {
      if (!section.contains(event.relatedTarget)) start();
    });
    reducedMotion.addEventListener("change", start);
    start();

    return section;
  }

  async function init(root) {
    if (initialized.has(root)) return;
    initialized.add(root);
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
      initialized.delete(root);
    }
  }

  function scan() {
    document.querySelectorAll(`#${ROOT_ID}`).forEach(init);
  }

  scan();

  new MutationObserver(scan).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
