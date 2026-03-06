// Ensure gtag is defined when GTM is used without standalone gtag snippet
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

(function () {
  // Queue events until gtag is confirmed ready
  var eventQueue = [];
  var gtagReady = false;

  function flushQueue() {
    gtagReady = true;
    eventQueue.forEach(function (item) {
      gtag('event', item.name, item.params);
    });
    eventQueue = [];
  }

  function trackRA(eventName, params) {
    var fullParams = Object.assign({ component: 'AI_Research_Assistant' }, params);
    if (gtagReady && typeof gtag === 'function') {
      gtag('event', eventName, fullParams);
    } else if (typeof gtag === 'function') {
      // gtag exists but we haven't confirmed it's ready — flush now
      flushQueue();
      gtag('event', eventName, fullParams);
    } else {
      // gtag not yet available — queue for later
      eventQueue.push({ name: eventName, params: fullParams });
    }
  }

  // Poll until gtag is available, then flush any queued events
  function waitForGtag() {
    if (typeof gtag === 'function') {
      flushQueue();
    } else {
      setTimeout(waitForGtag, 300);
    }
  }

  function attachTracking(shadowRoot) {
    // Guard against duplicate listeners on same root
    if (shadowRoot._raTracked) return;
    shadowRoot._raTracked = true;

    shadowRoot.addEventListener('click', function (e) {
      var target = e.target;

      var exampleQ = target.closest('.t-example-question');
      if (exampleQ) {
        var spanEl = exampleQ.querySelector('span');
        trackRA('ra_example_question_click', {
          question_text: spanEl ? spanEl.innerText.trim().slice(0, 100) : ''
        });
        return;
      }

      if (target.closest('.t-search-submit')) {
        var input = shadowRoot.querySelector('.t-searchbox');
        trackRA('ra_search_submitted', {
          query_length: (input && input.value) ? input.value.trim().length : 0
        });
        return;
      }

      if (
        target.closest('.t-header-landing-link') ||
        target.closest('.t-header-new-research-button') ||
        target.closest('.t-header-header-new-research')
      ) {
        trackRA('ra_new_topic_clicked');
        return;
      }

      if (
        target.closest('.t-header-sidenav-button') ||
        target.closest('.t-header-mobile-sidenav-button') ||
        target.closest('.t-header-sidenav-expand')
      ) {
        trackRA('ra_sidebar_toggled');
        return;
      }

      if (target.closest('.t-sidenav-help-link')) {
        trackRA('ra_help_link_clicked');
      }
    });

    trackRA('ra_component_viewed', {
      page_path: window.location.pathname
    });
  }

  function waitForComponent() {
    var el = document.querySelector('cdi-research-assistant');
    if (!el) {
      setTimeout(waitForComponent, 500);
      return;
    }

    var lastShadow = null;

    // Keep checking in case shadow root is recreated (SPA navigation)
    setInterval(function () {
      var shadow = el.shadowRoot;
      if (shadow && shadow !== lastShadow) {
        lastShadow = shadow;
        attachTracking(shadow);
      }
    }, 500);
  }

  // Start both polling chains immediately
  waitForGtag();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForComponent);
  } else {
    waitForComponent();
  }
})();
