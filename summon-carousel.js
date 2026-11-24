
(() => {
  "use strict";

  // --------------------------------------------------
  // CONFIGURATIE
  // --------------------------------------------------

  const GLOBAL_KEY = "__windesheimKohaCarousel";

  const FEED =
    "https://bibliotheek.windesheim.nl/public/carrousel.json";

  const ROOT_ID = "windesheim-koha-carousel";

  const AUTOPLAY_INTERVAL = 5000;

  // Voorkom dubbele initialisatie wanneer Summon
  // hetzelfde script meerdere keren uitvoert.
  if (window[GLOBAL_KEY]) {
    return;
  }

  const state = (window[GLOBAL_KEY] = {
    feedPromise: null,
    initialized: new WeakSet(),
    errorLogged: false,
    styleAdded: false
  });

  // --------------------------------------------------
  // HULPFUNCTIES
  // --------------------------------------------------

  function make(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== undefined && text !== null) {
      element.textContent = text;
    }

    return element;
  }

  function safeUrl(value, type) {
    if (!value) return null;

    try {
      const url = new URL(value, window.location.href);

      if (url.protocol !== "https:") {
        return null;
      }

      if (type === "image") {
        if (
          url.hostname === "images-na.ssl-images-amazon.com" ||
          url.hostname === "m.media-amazon.com"
        ) {
          return url.href;
        }

        return null;
      }

      if (type === "link") {
        if (url.hostname === "bibliotheek.windesheim.nl") {
          return url.href;
        }

        return null;
      }

      return null;
    } catch {
      return null;
    }
  }

  // --------------------------------------------------
  // CSS
  // --------------------------------------------------

  function addStyles() {
    if (state.styleAdded) return;

    state.styleAdded = true;

    const style = make("style");

    style.textContent = `
      #${ROOT_ID} {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        font-family: inherit;
        color: inherit;
      }

      #${ROOT_ID} *,
      #${ROOT_ID} *::before,
      #${ROOT_ID} *::after {
        box-sizing: border-box;
      }

      #${ROOT_ID} .koha-carousel-group {
        width: 100%;
        margin: 0 0 28px;
      }

      #${ROOT_ID} .koha-carousel-heading {
        margin: 0 0 14px;
        font-size: 1.25rem;
        font-weight: 700;
        line-height: 1.3;
      }

      #${ROOT_ID} .koha-carousel-toolbar {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin: 0 0 10px;
      }

      #${ROOT_ID} .koha-carousel-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        padding: 0;
        border: 1px solid #777;
        border-radius: 50%;
        background: #fff;
        color: #222;
        font-size: 22px;
        line-height: 1;
        cursor: pointer;
      }

      #${ROOT_ID} .koha-carousel-button:hover {
        background: #eee;
      }

      #${ROOT_ID} .koha-carousel-button:focus-visible {
        outline: 3px solid #006bb6;
        outline-offset: 3px;
      }

      #${ROOT_ID} .koha-carousel-track {
        display: flex;
        gap: 18px;
        width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 4px 2px 14px;
        scroll-behavior: smooth;
        scroll-snap-type: x mandatory;
        scrollbar-width: thin;
      }

      #${ROOT_ID} .koha-carousel-track::-webkit-scrollbar {
        height: 8px;
      }

      #${ROOT_ID} .koha-carousel-track::-webkit-scrollbar-thumb {
        background: #aaa;
        border-radius: 8px;
      }

      #${ROOT_ID} .koha-carousel-card {
        display: flex;
        flex: 0 0 155px;
        flex-direction: column;
        min-width: 0;
        scroll-snap-align: start;
        color: inherit;
        text-decoration: none;
      }

      #${ROOT_ID} .koha-carousel-card:focus-visible {
        outline: 3px solid #006bb6;
        outline-offset: 4px;
      }

      #${ROOT_ID} .koha-carousel-image-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 205px;
        overflow: hidden;
        background: #f3f3f3;
        border-radius: 3px;
      }

      #${ROOT_ID} .koha-carousel-image {
        display: block;
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        object-fit: contain;
      }

      #${ROOT_ID} .koha-carousel-title {
        margin: 9px 0 4px;
        font-size: 0.95rem;
        font-weight: 700;
        line-height: 1.35;
      }

      #${ROOT_ID} .koha-carousel-author {
        margin: 0;
        font-size: 0.85rem;
        line-height: 1.35;
        color: #555;
      }

      #${ROOT_ID} .koha-carousel-more {
        display: inline-block;
        margin-top: 10px;
        font-weight: 700;
      }

      #${ROOT_ID} .koha-carousel-status {
        padding: 12px 0;
      }

      @media (max-width: 600px) {
        #${ROOT_ID} .koha-carousel-card {
          flex-basis: 135px;
        }

        #${ROOT_ID} .koha-carousel-image-wrap {
          height: 180px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #${ROOT_ID} .koha-carousel-track {
          scroll-behavior: auto;
        }
      }
    `;

    document.head.appendChild(style);
  }

  // --------------------------------------------------
  // CARROUSEL OPBOUWEN
  // --------------------------------------------------

  function buildCarousel(group) {
    if (
      !group ||
      !Array.isArray(group.documents) ||
      group.documents.length === 0
    ) {
      return null;
    }

    const section = make("section", "koha-carousel-group");

    const heading = make(
      "h2",
      "koha-carousel-heading",
      group.title || "Aanbevolen boeken"
    );

    section.appendChild(heading);

    const toolbar = make("div", "koha-carousel-toolbar");

    const previousButton = make(
      "button",
      "koha-carousel-button",
      "‹"
    );

    previousButton.type = "button";
    previousButton.setAttribute(
      "aria-label",
      "Vorige boeken"
    );

    const nextButton = make(
      "button",
      "koha-carousel-button",
      "›"
    );

    nextButton.type = "button";
    nextButton.setAttribute(
      "aria-label",
      "Volgende boeken"
    );

    toolbar.append(previousButton, nextButton);
    section.appendChild(toolbar);

    const track = make("div", "koha-carousel-track");

    track.setAttribute("tabindex", "0");
    track.setAttribute(
      "aria-label",
      group.title || "Boekencollectie"
    );

    group.documents.forEach((book) => {
      if (!book) return;

      const imageUrl = safeUrl(book.image, "image");
      const bookUrl = safeUrl(book.url, "link");

      if (!imageUrl || !bookUrl) return;

      const card = make("a", "koha-carousel-card");
      card.href = bookUrl;
      card.target = "_blank";
      card.rel = "noopener noreferrer";

      const imageWrap = make(
        "div",
        "koha-carousel-image-wrap"
      );

      const image = make("img", "koha-carousel-image");

      image.src = imageUrl;
      image.alt = book.title || "Boekomslag";
      image.loading = "lazy";
      image.decoding = "async";

      imageWrap.appendChild(image);
      card.appendChild(imageWrap);

      const title = make(
        "div",
        "koha-carousel-title",
        book.title || "Titel onbekend"
      );

      card.appendChild(title);

      if (book.author) {
        const author = make(
          "p",
          "koha-carousel-author",
          book.author
        );

        card.appendChild(author);
      }

      track.appendChild(card);
    });

    if (!track.children.length) {
      return null;
    }

    section.appendChild(track);

    // Navigatieknoppen
    function scrollAmount() {
      const firstCard = track.querySelector(
        ".koha-carousel-card"
      );

      if (!firstCard) return 300;

      return firstCard.getBoundingClientRect().width + 18;
    }

    previousButton.addEventListener("click", () => {
      track.scrollBy({
        left: -scrollAmount() * 2,
        behavior: "smooth"
      });
    });

    nextButton.addEventListener("click", () => {
      track.scrollBy({
        left: scrollAmount() * 2,
        behavior: "smooth"
      });
    });

    // Automatisch scrollen
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!reducedMotion && track.children.length > 2) {
      let autoplay = null;
      let paused = false;

      function stopAutoplay() {
        if (autoplay) {
          window.clearInterval(autoplay);
          autoplay = null;
        }
      }

      function startAutoplay() {
        stopAutoplay();

        if (paused) return;

        autoplay = window.setInterval(() => {
          const maxScroll =
            track.scrollWidth - track.clientWidth;

          if (maxScroll <= 0) return;

          if (track.scrollLeft >= maxScroll - 5) {
            track.scrollTo({
              left: 0,
              behavior: "smooth"
            });
          } else {
            track.scrollBy({
              left: scrollAmount(),
              behavior: "smooth"
            });
          }
        }, AUTOPLAY_INTERVAL);
      }

      section.addEventListener("mouseenter", () => {
        paused = true;
        stopAutoplay();
      });

      section.addEventListener("mouseleave", () => {
        paused = false;
        startAutoplay();
      });

      section.addEventListener("focusin", () => {
        paused = true;
        stopAutoplay();
      });

      section.addEventListener("focusout", (event) => {
        if (!section.contains(event.relatedTarget)) {
          paused = false;
          startAutoplay();
        }
      });

      startAutoplay();
    }

    // Optionele link naar de volledige collectie
    const moreUrl = safeUrl(group.suffixUrl, "link");

    if (moreUrl) {
      const moreLink = make(
        "a",
        "koha-carousel-more",
        "Bekijk alle boeken"
      );

      moreLink.href = moreUrl;
      moreLink.target = "_blank";
      moreLink.rel = "noopener noreferrer";

      section.appendChild(moreLink);
    }

    return section;
  }

  // --------------------------------------------------
  // FEED LADEN EN WEERGEVEN
  // --------------------------------------------------

  async function init(root) {
    if (state.initialized.has(root)) return;

    state.initialized.add(root);

    root.replaceChildren(
      make(
        "div",
        "koha-carousel-status",
        "Boeken laden…"
      )
    );

    addStyles();

    try {
      // Gebruik één gedeelde aanvraag voor de hele pagina.
      if (!state.feedPromise) {
        state.feedPromise = fetch(FEED, {
          method: "GET",
          cache: "no-store",
          headers: {
            Accept: "application/json"
          }
        }).then((response) => {
          if (!response.ok) {
            throw new Error(
              `Feed gaf HTTP-status ${response.status}`
            );
          }

          return response.json();
        });
      }

      const groups = await state.feedPromise;

      if (!Array.isArray(groups)) {
        throw new Error("Ongeldig JSON-formaat in de feed.");
      }

      root.replaceChildren();

      groups.forEach((group) => {
        const carousel = buildCarousel(group);

        if (carousel) {
          root.appendChild(carousel);
        }
      });

      if (!root.children.length) {
        root.appendChild(
          make(
            "div",
            "koha-carousel-status",
            "Er zijn momenteel geen boeken beschikbaar."
          )
        );
      }

    } catch (error) {
      if (!state.errorLogged) {
        console.error(
          "Koha carousel: laden mislukt.",
          error
        );

        state.errorLogged = true;
      }

      root.replaceChildren(
        make(
          "div",
          "koha-carousel-status",
          "De boeken zijn momenteel niet beschikbaar."
        )
      );
    }
  }

  // --------------------------------------------------
  // SUMMON: PANEL VINDEN EN INITIALISEREN
  // --------------------------------------------------

  function scan() {
    const roots = document.querySelectorAll(
      `#${ROOT_ID}`
    );

    roots.forEach((root) => {
      init(root);
    });
  }

// Eenmalig initialiseren.
// Het script staat direct na de carousel-div in het Custom Panel.
const root = document.getElementById(ROOT_ID);

if (root) {
  init(root);
} else {
  console.warn(
    "Koha carousel: container niet gevonden. Geen nieuwe verzoeken gestart."
  );
}

})();
