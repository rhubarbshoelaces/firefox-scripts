// ==UserScript==
// @name           Custom Button: Washington Post
// @author         rhubarbshoelaces
// @homepageURL    https://github.com/rhubarbshoelaces/firefox-scripts/
// @include        main
// ==/UserScript==

(function() {
  if (location != "chrome://browser/content/browser.xul" &&
      location != "chrome://browser/content/browser.xhtml") return;

  window.UC_ButtonConfigQueue = window.UC_ButtonConfigQueue || [];

  window.UC_ButtonConfigQueue.push({
    id: "custombutton_washingtonpost",
    name: "Washington Post",
    icon: "chrome://userchromejs/content/icons/washingtonpost.svg",
    searchUrl: "https://www.washingtonpost.com/search?query=%s",
    defaultUrl: "https://www.washingtonpost.com/",
    menu: [
      {
        type: "rss",
        url: "https://www.washingtonpost.com/arcio/rss/",
        limit: 15,
        image: "chrome://userchromejs/content/icons/washingtonpost.svg"
      }
    ]
  });
})();