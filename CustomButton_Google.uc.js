// ==UserScript==
// @name           Custom Button: Google
// @description    Adds a Google button via Factory (Smart Search + Domain parsing)
// @include        main
// ==/UserScript==

(function() {
  if (location != "chrome://browser/content/browser.xul" &&
      location != "chrome://browser/content/browser.xhtml") return;

  window.UC_ButtonConfigQueue = window.UC_ButtonConfigQueue || [];

  window.UC_ButtonConfigQueue.push({
    id: "custombutton_google",
    name: "Google",
    icon: "chrome://userchromejs/content/icons/google.svg",
    searchUrl: "https://www.google.com/search?q=%s",
    defaultUrl: "https://www.google.com/",
    menu: [
      {
        type: "search",
        name: "Google Site Search",
        image: "chrome://userchromejs/content/icons/sitesearch.svg",
        searchUrl: "https://www.google.com/search?q=%s+site:%domain%",
        defaultUrl: "https://www.google.com/search?q=site:%domain%"
      },
      {
        type: "search",
        name: "Google Shopping",
        image: "chrome://userchromejs/content/icons/googleshopping.svg",
        searchUrl: "https://www.google.com/search?tbm=shop&q=%s",
        defaultUrl: "https://shopping.google.com/"
      }
    ]
  });
})();