// ==UserScript==
// @name           Custom Button: NYTimes
// @description    Adds a NYTimes button via Factory
// @author         rhubarbshoelaces
// @homepageURL    https://github.com/rhubarbshoelaces/firefox-scripts/
// @include        main
// ==/UserScript==

(function() {
  if (location != "chrome://browser/content/browser.xul" &&
      location != "chrome://browser/content/browser.xhtml") return;

  window.UC_ButtonConfigQueue = window.UC_ButtonConfigQueue || [];

  window.UC_ButtonConfigQueue.push({
    id: "custombutton_nytimes",
    name: "New York Times",
    icon: "chrome://userchromejs/content/icons/nytimes.svg",
    searchUrl: "https://www.nytimes.com/search?dropmab=false&query=%s",
    defaultUrl: "https://www.nytimes.com/",
    menu: [
      {
        type: "search",
        name: "Wirecutter Product Reviews",
        image: "chrome://userchromejs/content/icons/wirecutter.svg",
        searchUrl: "https://www.nytimes.com/wirecutter/search/?s=%s",
        defaultUrl: "https://www.nytimes.com/wirecutter"
      },
      {
        type: "separator"
      },
      {
        type: "rss",
        url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
        limit: 15,
        image: "chrome://userchromejs/content/icons/nytimes.svg"
      }
    ]
  });
})();