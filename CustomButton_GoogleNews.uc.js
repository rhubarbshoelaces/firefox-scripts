// ==UserScript==
// @name           Custom Button: Google News
// @description    Adds a Google News button via Factory
// @author         rhubarbshoelaces
// @homepageURL    https://github.com/rhubarbshoelaces/firefox-scripts/
// @include        main
// ==/UserScript==

(function() {
  if (location != "chrome://browser/content/browser.xul" &&
      location != "chrome://browser/content/browser.xhtml") return;

  window.UC_ButtonConfigQueue = window.UC_ButtonConfigQueue || [];

  window.UC_ButtonConfigQueue.push({
    id: "custombutton_googlenews",
    name: "Google News",
    icon: "chrome://userchromejs/content/icons/googlenews.svg",
    searchUrl: "https://www.google.com/search?tbm=nws&q=%s",
    defaultUrl: "https://news.google.com/",
    menu: [
      {
        type: "rss",
        url: "https://news.google.com/rss",
        limit: 15,
        trimTitle: " - (?!.* - ).*$" 
      }
    ]
  });
})();