// ==UserScript==
// @name           Custom Button: Reddit
// @description    Adds a Reddit button via Factory
// @include        main
// ==/UserScript==

(function() {
  if (location != "chrome://browser/content/browser.xul" &&
      location != "chrome://browser/content/browser.xhtml") return;

  window.UC_ButtonConfigQueue = window.UC_ButtonConfigQueue || [];

  window.UC_ButtonConfigQueue.push({
    id: "custombutton_reddit",
    name: "Reddit",
    icon: "chrome://userchromejs/content/icons/reddit.svg",
    searchUrl: "https://www.reddit.com/search/?q=%s",
    defaultUrl: "https://www.reddit.com/",
    menu: [
      {
        type: "bookmark",
        name: "r/popular",
        image: "chrome://userchromejs/content/icons/reddit.svg",
        url: "https://www.reddit.com/r/popular/"
      },
      {
        type: "separator"
      },
      {
        type: "rss",
        url: "https://www.reddit.com/r/FirefoxCSS/.rss",
        limit: 15,
        image: "chrome://userchromejs/content/icons/reddit.svg"
      }
    ]
  });
})();