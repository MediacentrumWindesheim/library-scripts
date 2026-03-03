(function () {
  function trackRA(eventName, params) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, Object.assign({ component: 'AI_Research_Assistant' }, params));
    }
  }

  function getShadowText(shadowRoot, selector) {
    var el = shadowRoot.querySelector(selector);
    return el ? el.innerText.trim().slice(0, 100) : '';
  }

  function getShadowValue(shadowRoot, selector) {
    var el = shadowRoot.querySelector(selector);
    return el ? el.value : '';
  }

  function attachTracking(shadowRoot) {
    shadowRoot.addEventListener('click', function (e) {
      var target = e.target;

      var exampleQ = target.closest('.t-example-question');
      if (exampleQ) {
        var spanEl = exampleQ.querySelector('span');
        trackRA('ra_example_question_click', {
          question_text: spanEl ? spanEl.innerText.trim().slice(0, 100) : ''
        });
      }

      if (target.closest('.t-search-submit')) {
        var input = shadowRoot.querySelector('.t-searchbox');
        trackRA('ra_search_submitted', {
          query_length: (input && input.value) ? input.value.trim().length : 0
        });
      }

      if (target.closest('.t-header-landing-link') ||
          target.closest('.t-header-new-research-button') ||
          target.closest('.t-header-header-new-research')) {
        trackRA('ra_new_topic_clicked');
      }

      if (target.closest('.t-header-sidenav-button') ||
          target.closest('.t-header-mobile-sidenav-button') ||
          target.closest('.t-header-sidenav-expand')) {
        trackRA('ra_sidebar_toggled');
      }

      if (target.closest('.t-sidenav-help-link')) {
        trackRA('ra_help_link_clicked');
      }
    });

    shadowRoot.addEventListener('submit', function (e) {
      var input = shadowRoot.querySelector('input[formcontrolname="input"]');
      var contentType = shadowRoot.querySelector('.t-search-dropdown-contenttype');
      var dateFilter = shadowRoot.querySelector('.t-search-dropdown-date');
      trackRA('ra_search_submitted', {
        query_length: (input && input.value) ? input.value.trim().length : 0,
        content_type: contentType ? contentType.value : '',
        date_filter: dateFilter ? dateFilter.value : ''
      });
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

    var interval = setInterval(function () {
      var shadow = el.shadowRoot;
      if (shadow) {
        clearInterval(interval);
        attachTracking(shadow);
      }
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForComponent);
  } else {
    waitForComponent();
  }
})();
